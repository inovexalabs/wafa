// In-memory stand-in for SupabaseService used by the security e2e tests. It
// never touches a real project: every query is recorded (table + chained
// calls) so tests can assert exactly which rows a request was scoped to.

export type Profile = { id: string; user_id: string; email: string; role: string };
export type QueryRecord = { table: string; calls: [string, unknown[]][] };

type Result = { data: unknown; error: unknown; count?: number };

export class FakeSupabase {
  readonly queries: QueryRecord[] = [];
  readonly authAdminCalls: [string, unknown[]][] = [];

  /** @param sessions access token -> profile it belongs to */
  constructor(private readonly sessions: Record<string, Profile>) {}

  setRole(token: string, role: string) {
    this.sessions[token] = { ...this.sessions[token], role };
  }

  reset() {
    this.queries.length = 0;
    this.authAdminCalls.length = 0;
  }

  /** Every query against `table`, each as a list of [method, args]. */
  on(table: string) {
    return this.queries.filter((q) => q.table === table);
  }

  /** True if `value` appears anywhere in any recorded query. */
  mentions(value: string) {
    return JSON.stringify(this.queries).includes(value);
  }

  getAdminClient() {
    return this.client;
  }

  createSessionClient() {
    return this.client;
  }

  private readonly client = {
    from: (table: string) => this.query(table),
    storage: { from: (bucket: string) => this.query(`storage:${bucket}`) },
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: (token: string) => {
        const profile = this.sessions[token];
        return Promise.resolve(
          profile
            ? { data: { user: { id: profile.id } }, error: null }
            : { data: { user: null }, error: { message: 'invalid JWT' } },
        );
      },
      signInWithPassword: () =>
        Promise.resolve({ data: {}, error: { message: 'Invalid login credentials' } }),
      refreshSession: () =>
        Promise.resolve({ data: {}, error: { message: 'Invalid refresh token' } }),
      admin: new Proxy(
        {},
        {
          get:
            (_target, op) =>
            (...args: unknown[]) => {
              this.authAdminCalls.push([String(op), args]);
              return Promise.resolve({ data: { user: null }, error: { message: 'fake' } });
            },
        },
      ),
    },
  };

  private query(table: string) {
    const record: QueryRecord = { table, calls: [] };
    this.queries.push(record);
    const builder: unknown = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'then') {
            return (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(this.respond(record, false)).then(resolve, reject);
          }
          if (prop === 'single' || prop === 'maybeSingle') {
            return () => {
              record.calls.push([prop, []]);
              return Promise.resolve(this.respond(record, true));
            };
          }
          return (...args: unknown[]) => {
            record.calls.push([String(prop), args]);
            return builder;
          };
        },
      },
    );
    return builder;
  }

  private eqValue(record: QueryRecord, column: string) {
    const call = record.calls.find(([method, args]) => method === 'eq' && args[0] === column);
    return call?.[1][1] as string | undefined;
  }

  private respond(record: QueryRecord, single: boolean): Result {
    if (record.table.startsWith('storage:'))
      return { data: { path: 'fake', signedUrl: 'https://storage.example/signed' }, error: null };

    if (record.table === 'profiles' && single) {
      const id = this.eqValue(record, 'id');
      const profile = Object.values(this.sessions).find((p) => p.id === id);
      return { data: profile ?? null, error: null };
    }
    if (record.table === 'members' && single) {
      const authUserId = this.eqValue(record, 'auth_user_id');
      return authUserId
        ? { data: { id: `member-of-${authUserId}`, status: 'active' }, error: null }
        : { data: null, error: null };
    }
    return single ? { data: null, error: null } : { data: [], error: null, count: 0 };
  }
}
