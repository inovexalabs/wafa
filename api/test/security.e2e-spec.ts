import { Controller, Get, INestApplication, RequestMethod, Type, UnauthorizedException } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuthGuard } from '../src/auth/auth.guard';
import { AuthService } from '../src/auth/auth.service';
import { IS_PUBLIC_KEY } from '../src/auth/public.decorator';
import { ROLES_KEY, type Role } from '../src/auth/roles.decorator';
import { SupabaseService } from '../src/supabase.service';
import { FakeSupabase, type Profile } from './fake-supabase';

// ---------- fixtures ----------

const ROLES: Role[] = ['superadmin', 'admin', 'accountant', 'member'];
const ID = (n: number) => `10000000-0000-4000-8000-00000000000${n}`;
const PARAM = '20000000-0000-4000-8000-000000000001';
const VICTIM = '30000000-0000-4000-8000-0000000000ff';

const PROFILES: Record<string, Profile> = {
  'tok-superadmin': { id: ID(1), user_id: 'super', email: 's@x.test', role: 'superadmin' },
  'tok-admin': { id: ID(2), user_id: 'admin', email: 'a@x.test', role: 'admin' },
  'tok-accountant': { id: ID(3), user_id: 'acct', email: 'c@x.test', role: 'accountant' },
  'tok-member': { id: ID(4), user_id: 'member-a', email: 'm@x.test', role: 'member' },
};
const tokenFor = (role: Role) => `tok-${role}`;

// Routes that are meant to work without a session. Anything else marked
// @Public() fails the test, so opening a route up is always a deliberate edit.
const EXPECTED_PUBLIC = [
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  'GET /api/public/career',
  'GET /api/public/landing',
  'GET /api/public/landing-items',
  'GET /api/public/landing-people',
  'GET /api/public/news',
  'GET /api/public/news/:slug',
  'GET /api/public/documents',
  'GET /api/public/documents/:id/file',
  'POST /api/public/contact',
  'POST /api/zoom/webhook',
].sort();

// ---------- route discovery ----------

type Route = {
  verb: 'get' | 'post' | 'put' | 'patch' | 'delete';
  template: string;
  url: string;
  isPublic: boolean;
  roles?: Role[];
};

const VERBS: Partial<Record<RequestMethod, Route['verb']>> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
};

function first<T>(value: T | T[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function discoverRoutes(): Route[] {
  const controllers = Reflect.getMetadata('controllers', AppModule) as Type[];
  const routes: Route[] = [];
  for (const controller of controllers) {
    const base = first(Reflect.getMetadata(PATH_METADATA, controller) as string | string[]);
    const seen = new Set<string>();
    // Walk the prototype chain: some controllers inherit their handlers.
    for (let proto = controller.prototype; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
      for (const name of Object.getOwnPropertyNames(proto)) {
        if (name === 'constructor' || seen.has(name)) continue;
        const handler = proto[name] as unknown;
        if (typeof handler !== 'function') continue;
        const path = first(Reflect.getMetadata(PATH_METADATA, handler) as string | string[] | undefined);
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        if (path === undefined || method === undefined) continue;
        seen.add(name);
        const template = '/' + ['api', base, path].filter((p) => p && p !== '/').join('/');
        const meta = <T>(key: string) =>
          (Reflect.getMetadata(key, handler) as T | undefined) ?? (Reflect.getMetadata(key, controller) as T | undefined);
        routes.push({
          verb: VERBS[method]!,
          template,
          url: template.replace(/:\w+/g, PARAM),
          isPublic: meta<boolean>(IS_PUBLIC_KEY) === true,
          roles: meta<Role[]>(ROLES_KEY),
        });
      }
    }
  }
  return routes;
}

async function createApp(fake: FakeSupabase, { throttle = false, production = false } = {}) {
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SupabaseService)
    .useValue(fake);
  if (!throttle) {
    // The route matrix sends hundreds of requests; rate limiting has its own tests.
    builder = builder.overrideProvider(ThrottlerStorage).useValue({
      increment: () => Promise.resolve({ totalHits: 1, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 }),
    });
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication({ rawBody: true, logger: false });
  configureApp(app, { production });
  await app.init();
  return app;
}

// ---------- tests ----------

describe('Security (e2e)', () => {
  const routes = discoverRoutes();
  const protectedRoutes = routes.filter((r) => !r.isPublic);
  let fake: FakeSupabase;
  let app: INestApplication;

  beforeAll(async () => {
    fake = new FakeSupabase({ ...PROFILES });
    app = await createApp(fake);
  });
  afterAll(() => app.close());
  beforeEach(() => fake.reset());

  const http = () => request(app.getHttpServer());

  describe('route inventory', () => {
    it('discovers the API routes', () => {
      expect(routes.length).toBeGreaterThan(80);
    });

    it('only the expected routes are public', () => {
      const actual = routes.filter((r) => r.isPublic).map((r) => `${r.verb.toUpperCase()} ${r.template}`);
      expect(actual.sort()).toEqual(EXPECTED_PUBLIC);
    });

    it('every protected route declares which roles may call it', () => {
      const unscoped = protectedRoutes.filter((r) => !r.roles?.length).map((r) => r.template);
      expect(unscoped).toEqual([]);
    });
  });

  describe('missing authentication is rejected by default', () => {
    it.each(protectedRoutes.map((r) => [r.verb.toUpperCase(), r.template, r] as const))(
      '%s %s -> 401 without a session, 401 with a forged token',
      async (_verb, _template, route) => {
        await http()[route.verb](route.url).expect(401);
        await http()[route.verb](route.url).set('Authorization', 'Bearer forged.jwt.token').expect(401);
        await http()[route.verb](route.url).set('Cookie', 'wafa_access_token=expired').expect(401);
      },
    );

    it('a new controller that forgets @UseGuards is still protected', async () => {
      @Controller('forgotten')
      class ForgottenController {
        @Get()
        secrets() {
          return ['should never be served'];
        }
      }
      const moduleRef = await Test.createTestingModule({
        controllers: [ForgottenController],
        providers: [
          { provide: APP_GUARD, useClass: AuthGuard },
          {
            provide: AuthService,
            useValue: {
              authenticate: () => Promise.reject(new UnauthorizedException()),
            },
          },
        ],
      }).compile();
      const bare = moduleRef.createNestApplication({ logger: false });
      await bare.init();
      await request(bare.getHttpServer()).get('/forgotten').expect(401);
      await bare.close();
    });
  });

  describe('roles are enforced on every protected route', () => {
    const cases = protectedRoutes.flatMap((route) =>
      ROLES.map((role) => [role, route.verb.toUpperCase(), route.template, route] as const),
    );
    it.each(cases)('%s -> %s %s', async (role, _verb, _template, route) => {
      const res = await http()[route.verb](route.url).set('Authorization', `Bearer ${tokenFor(role)}`);
      if (route.roles!.includes(role)) {
        // Past the guard (the fake DB may make the handler itself fail).
        expect([401, 403]).not.toContain(res.status);
      } else {
        expect(res.status).toBe(403);
      }
    });

    it('no GET route crashes with an unhandled error for an allowed role', async () => {
      // An unhandled exception (e.g. a dependency that was never injected)
      // surfaces as a bare "Internal server error"; handled failures carry
      // their own message.
      const crashed: string[] = [];
      for (const route of protectedRoutes.filter((r) => r.verb === 'get')) {
        const role = route.roles![0];
        const res = await http().get(route.url).set('Authorization', `Bearer ${tokenFor(role)}`);
        if (res.status === 500 && (res.body as { message?: string }).message === 'Internal server error')
          crashed.push(`${role} ${route.template}`);
      }
      expect(crashed).toEqual([]);
    });

    it.each(['superadmin', 'admin', 'accountant'] as const)('%s can load their own documents', async (role) => {
      await http().get(`/api/${role}/my-documents`).set('Authorization', `Bearer ${tokenFor(role)}`).expect(200);
    });

    it('a role change takes effect on the next request with the same token', async () => {
      const local = new FakeSupabase({ ...PROFILES });
      const localApp = await createApp(local);
      const call = () =>
        request(localApp.getHttpServer()).get('/api/admin/members').set('Authorization', 'Bearer tok-admin');
      expect((await call()).status).not.toBe(403);
      local.setRole('tok-admin', 'member');
      await call().expect(403);
      await localApp.close();
    });
  });

  describe('ownership comes from the session, never the request (IDOR)', () => {
    const member = PROFILES['tok-member'];
    const ownMemberId = `member-of-${member.id}`;
    const asMember = (r: request.Test) => r.set('Authorization', 'Bearer tok-member');

    it('receipts: a memberId in the query string is ignored', async () => {
      await asMember(http().get(`/api/member/receipts?memberId=${VICTIM}&member_id=${VICTIM}`));
      const query = fake.on('payment_receipts')[0];
      expect(query.calls).toContainEqual(['eq', ['member_id', ownMemberId]]);
      expect(fake.mentions(VICTIM)).toBe(false);
    });

    it('ledger: a memberId in the query string is ignored', async () => {
      await asMember(http().get(`/api/member/ledger/entries?memberId=${VICTIM}`));
      await asMember(http().get(`/api/member/ledger/summary?memberId=${VICTIM}`));
      expect(fake.mentions(VICTIM)).toBe(false);
    });

    it('documents: file links are scoped to the caller', async () => {
      await asMember(http().get(`/api/member/documents/${PARAM}/file?memberId=${VICTIM}`)).expect(404);
      const query = fake.on('member_documents')[0];
      expect(query.calls).toContainEqual(['eq', ['member_id', ownMemberId]]);
      expect(fake.mentions(VICTIM)).toBe(false);
    });

    it("notifications: marking one read can't touch another user's", async () => {
      await asMember(http().post(`/api/member/notifications/${PARAM}/read`).send({ profileId: VICTIM }));
      const query = fake.on('notifications')[0];
      expect(query.calls).toContainEqual(['eq', ['profile_id', member.id]]);
      expect(fake.mentions(VICTIM)).toBe(false);
    });

    it('member profile: id / role / owner fields in the body are ignored', async () => {
      await asMember(
        http()
          .patch('/api/member/profile')
          .send({ fullName: 'New Name', id: VICTIM, role: 'superadmin', auth_user_id: VICTIM, status: 'active' }),
      );
      const update = fake.on('members').find((q) => q.calls.some(([m]) => m === 'update'))!;
      expect(update.calls).toContainEqual(['update', [{ full_name: 'New Name' }]]);
      expect(update.calls).toContainEqual(['eq', ['id', ownMemberId]]);
      expect(fake.mentions(VICTIM)).toBe(false);
      expect(fake.on('profiles').some((q) => q.calls.some(([m]) => m === 'update'))).toBe(false);
    });

    it('staff profile: a role in the body cannot escalate privileges', async () => {
      await http()
        .patch('/api/admin/profile')
        .set('Authorization', 'Bearer tok-admin')
        .send({ fullName: 'Admin', role: 'superadmin', id: VICTIM });
      const update = fake.on('profiles').find((q) => q.calls.some(([m]) => m === 'update'))!;
      expect(update.calls).toContainEqual(['update', [{ full_name: 'Admin' }]]);
      expect(update.calls).toContainEqual(['eq', ['id', PROFILES['tok-admin'].id]]);
      expect(fake.mentions(VICTIM)).toBe(false);
    });

    it.each(['superadmin', 'admin'])('an admin cannot create a %s account', async (role) => {
      const res = await http()
        .post('/api/auth/admin/users')
        .set('Authorization', 'Bearer tok-admin')
        .send({ userId: 'new', email: 'new@x.test', password: 'long-enough-1', role });
      expect([400, 401, 403]).toContain(res.status);
      expect(fake.authAdminCalls.filter(([op]) => op === 'createUser')).toEqual([]);
    });

    it('nobody can create a superadmin, not even a superadmin', async () => {
      const res = await http()
        .post('/api/auth/superadmin/users')
        .set('Authorization', 'Bearer tok-superadmin')
        .send({ userId: 'new', email: 'new@x.test', password: 'long-enough-1', role: 'superadmin' });
      expect(res.status).toBe(400);
      expect(fake.authAdminCalls.filter(([op]) => op === 'createUser')).toEqual([]);
    });
  });

  describe('uploads', () => {
    const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const receipt = () =>
      http()
        .post('/api/member/receipts')
        .set('Authorization', 'Bearer tok-member')
        .field('amount', '100')
        .field('paymentDate', '2026-10-01')
        .field('paymentType', 'monthly_deposit');
    const uploads = () => fake.on('storage:receipts').filter((q) => q.calls.some(([m]) => m === 'upload'));

    it('rejects files over the size limit before reading them into the handler', async () => {
      await receipt()
        .attach('file', Buffer.alloc(11 * 1024 * 1024), { filename: 'big.png', contentType: 'image/png' })
        .expect(413);
      await http()
        .post('/api/superadmin/documents')
        .set('Authorization', 'Bearer tok-superadmin')
        .attach('file', Buffer.alloc(26 * 1024 * 1024), { filename: 'big.pdf', contentType: 'application/pdf' })
        .expect(413);
      expect(uploads()).toEqual([]);
    });

    it.each([
      ['HTML with a spoofed image type', '<html><script>alert(1)</script></html>', 'evil.png', 'image/png'],
      ['SVG with a spoofed image type', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', 'x.png', 'image/png'],
      ['SVG declared as SVG', '<svg xmlns="http://www.w3.org/2000/svg"/>', 'x.svg', 'image/svg+xml'],
      ['a script with a PDF extension', 'alert(document.cookie)', 'receipt.pdf', 'application/pdf'],
      ['a malformed PNG (truncated header)', '\x89PNG', 'broken.png', 'image/png'],
    ])('rejects %s and stores nothing', async (_label, content, filename, contentType) => {
      await receipt().attach('file', Buffer.from(content, 'latin1'), { filename, contentType }).expect(400);
      expect(uploads()).toEqual([]);
    });

    it('stores the detected type, not the one the client declared', async () => {
      await receipt().attach('file', PNG, { filename: 'scan.jpg', contentType: 'image/jpeg' });
      const [upload] = uploads();
      const call = upload.calls.find(([m]) => m === 'upload')!;
      expect(call[1][2]).toEqual({ contentType: 'image/png' });
    });

    it('landing media rejects an SVG labelled as an image', async () => {
      await http()
        .post('/api/superadmin/landing-media/upload')
        .set('Authorization', 'Bearer tok-superadmin')
        .attach('file', Buffer.from('<svg onload="alert(1)"/>'), { filename: 'logo.png', contentType: 'image/png' })
        .expect(400);
    });
  });

  describe('CMS links', () => {
    it.each([
      ['/api/superadmin/landing-items', 'landing_items', { kind: 'partner', title: 'X', linkUrl: 'javascript:alert(1)' }],
      ['/api/superadmin/career', 'career_openings', { title: 'Job', applyUrl: 'data:text/html,<script>alert(1)</script>' }],
    ])('%s rejects script URLs and writes nothing', async (url, table, body) => {
      const res = await http().post(url).set('Authorization', 'Bearer tok-superadmin').send(body).expect(400);
      expect(String((res.body as { message: string }).message)).toMatch(/http/i);
      expect(fake.on(table).some((q) => q.calls.some(([m]) => m === 'insert'))).toBe(false);
    });
  });

  describe('CSRF', () => {
    it('blocks a cookie-authenticated write from another origin', async () => {
      await http()
        .patch('/api/member/profile')
        .set('Cookie', 'wafa_access_token=tok-member')
        .set('Origin', 'https://evil.example')
        .send({ fullName: 'pwned' })
        .expect(403, { message: 'Cross-origin request blocked.' });
    });

    it('blocks a look-alike origin that only shares a prefix', async () => {
      await http()
        .patch('/api/member/profile')
        .set('Cookie', 'wafa_access_token=tok-member')
        .set('Origin', 'http://localhost:3000.evil.example')
        .send({ fullName: 'pwned' })
        .expect(403);
    });
  });
});

describe('Transport and rate limiting (e2e)', () => {
  it('production mode refuses plain HTTP but allows HTTPS from the proxy', async () => {
    const app = await createApp(new FakeSupabase({ ...PROFILES }), { production: true });
    const http = request(app.getHttpServer());
    await http.get('/api/public/landing').expect(403, { message: 'HTTPS is required.' });
    await http.get('/api/public/landing').set('X-Forwarded-Proto', 'https').expect(200);
    await http.get('/api/health').expect(200);
    await app.close();
  });

  describe('login throttling (5 per minute per client)', () => {
    let app: INestApplication;
    beforeEach(async () => {
      app = await createApp(new FakeSupabase({ ...PROFILES }), { throttle: true });
    });
    afterEach(() => app.close());

    const login = (forwardedFor: string) =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', forwardedFor)
        .send({ userId: 'nobody', password: 'wrong' });

    it('blocks the sixth attempt', async () => {
      for (let i = 0; i < 5; i++) await login('203.0.113.7').expect(401);
      await login('203.0.113.7').expect(429);
    });

    it('a client cannot reset its budget by spoofing X-Forwarded-For', async () => {
      // The hosting proxy appends the real client IP last; with one trusted
      // hop that is the address used, whatever the client prepended.
      for (let i = 0; i < 5; i++) await login(`198.51.100.${i}, 203.0.113.7`).expect(401);
      await login('198.51.100.99, 203.0.113.7').expect(429);
    });

    it('different real clients get separate budgets', async () => {
      for (let i = 0; i < 5; i++) await login('203.0.113.7').expect(401);
      await login('203.0.113.8').expect(401);
    });
  });

  describe('with CLIENT_IP_HEADER (Cloudflare in front, as on Render)', () => {
    let app: INestApplication;
    beforeEach(async () => {
      process.env.CLIENT_IP_HEADER = 'CF-Connecting-IP';
      app = await createApp(new FakeSupabase({ ...PROFILES }), { throttle: true });
    });
    afterEach(async () => {
      delete process.env.CLIENT_IP_HEADER;
      await app.close();
    });

    // Every request arrives from the same load balancer, with whatever
    // X-Forwarded-For the client chose; only the edge header identifies it.
    const login = (clientIp: string | undefined, forwardedFor: string) => {
      const req = request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', forwardedFor);
      if (clientIp) req.set('CF-Connecting-IP', clientIp);
      return req.send({ userId: 'nobody', password: 'wrong' });
    };

    it('budgets per real client, ignoring a spoofed X-Forwarded-For', async () => {
      for (let i = 0; i < 5; i++) await login('45.64.163.229', `198.51.100.${i}, 10.30.224.5`).expect(401);
      await login('45.64.163.229', '198.51.100.99, 10.30.224.5').expect(429);
    });

    it('does not lump different clients behind one load balancer together', async () => {
      for (let i = 0; i < 5; i++) await login('45.64.163.229', '10.30.224.5').expect(401);
      await login('45.64.163.230', '10.30.224.5').expect(401);
    });

    it('ignores a header value that is not an IP address', async () => {
      for (let i = 0; i < 5; i++) await login(`not-an-ip-${i}`, '203.0.113.7').expect(401);
      await login('also-not-an-ip', '203.0.113.7').expect(429);
    });
  });
});
