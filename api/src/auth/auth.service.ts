import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

type CreateUserRole = 'admin' | 'member' | 'accountant';
type CreatorRole = 'superadmin' | 'admin';

interface CreateUserInput {
  userId: string;
  email: string;
  password: string;
  role: CreateUserRole;
  fullName?: string;
  memberNumber?: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  private async getProfile(identifier: string) {
    const client = this.supabase.getAdminClient();
    const trimmedIdentifier = identifier.trim();

    const { data: profileById, error: idError } = await client.from('profiles')
      .select('id, user_id, email, role').eq('user_id', trimmedIdentifier).maybeSingle();
    if (idError) throw new InternalServerErrorException('Unable to look up the user.');
    if (profileById) return profileById;

    const { data: profileByEmail, error: emailError } = await client.from('profiles')
      .select('id, user_id, email, role').eq('email', trimmedIdentifier.toLowerCase()).maybeSingle();
    if (emailError) throw new InternalServerErrorException('Unable to look up the user.');
    return profileByEmail;
  }

  private async sessionResult(accessToken: string, refreshToken: string, authUserId: string) {
    const { data: profile, error } = await this.supabase.getAdminClient().from('profiles')
      .select('id, user_id, email, role').eq('id', authUserId).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to look up the user profile.');
    if (!profile) throw new UnauthorizedException('User profile not found.');
    return { accessToken, refreshToken, user: { id: profile.id, userId: profile.user_id, role: profile.role } };
  }

  async authenticate(accessToken: string) {
    if (!accessToken) throw new UnauthorizedException('Authentication is required.');
    const client = this.supabase.getAdminClient();
    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) throw new UnauthorizedException('Invalid or expired access token.');
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('id, user_id, email, role').eq('id', user.id).maybeSingle();
    if (profileError) throw new InternalServerErrorException('Unable to verify your role.');
    if (!profile) throw new UnauthorizedException('User profile not found.');
    return { user, profile };
  }
  async login(userId: string, password: string) {
    if (!userId || !password) throw new BadRequestException('User ID and password are required.');
    const profile = await this.getProfile(userId);
    if (!profile) throw new UnauthorizedException('Invalid user ID or password.');
    const { data, error } = await this.supabase.getAdminClient().auth.signInWithPassword({ email: profile.email, password });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Invalid user ID or password.');
    return this.sessionResult(data.session.access_token, data.session.refresh_token, data.user.id);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token is required.');
    const { data, error } = await this.supabase.getAdminClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Session expired. Please sign in again.');
    return this.sessionResult(data.session.access_token, data.session.refresh_token, data.user.id);
  }

  async logout(accessToken?: string) {
    if (!accessToken) return;
    const client = this.supabase.getAdminClient();
    const { data: { user } } = await client.auth.getUser(accessToken);
    if (user) await client.auth.admin.signOut(user.id, 'global');
  }

  async createUser(accessToken: string, input: CreateUserInput, routeRole: CreatorRole) {
    if (!accessToken) throw new UnauthorizedException('Bearer token is required.');
    if (!input?.userId || !input.email || !input.password || !['admin', 'member', 'accountant'].includes(input.role)) {
      throw new BadRequestException('userId, email, password, and a valid role are required.');
    }
    if (input.password.length < 8) throw new BadRequestException('Password must be at least 8 characters.');

    const client = this.supabase.getAdminClient();
    const { data: { user: requester }, error: requesterError } = await client.auth.getUser(accessToken);
    if (requesterError || !requester) throw new UnauthorizedException('Invalid or expired access token.');

    const { data: requesterProfile, error: requesterProfileError } = await client.from('profiles')
      .select('role').eq('id', requester.id).maybeSingle();
    if (requesterProfileError) throw new InternalServerErrorException('Unable to verify your role.');
    if (!requesterProfile || requesterProfile.role !== routeRole) {
      throw new UnauthorizedException('You are not allowed to use this user-creation route.');
    }
    if (routeRole === 'admin' && !['member', 'accountant'].includes(input.role)) {
      throw new UnauthorizedException('Admins can only create members or accountants.');
    }

    const email = input.email.trim().toLowerCase();
    const userId = input.userId.trim();
    const { data: created, error: createError } = await client.auth.admin.createUser({
      email, password: input.password, email_confirm: true, app_metadata: { role: input.role },
    });
    if (createError || !created.user) {
      throw new BadRequestException(createError?.message ?? 'Unable to create the user.');
    }

    const { error: profileError } = await client.from('profiles').insert({
      id: created.user.id, user_id: userId, email, role: input.role, created_by: requester.id,
      full_name: input.fullName?.trim() || userId, phone: input.phone?.trim() || null,
    });
    if (profileError) {
      await client.auth.admin.deleteUser(created.user.id);
      throw new BadRequestException(profileError.code === '23505' ? 'That user ID or email is already in use.' : 'Unable to create the user profile.');
    }

    if (input.role === 'member') {
      const fullName = input.fullName?.trim() || userId;
      const memberNumber = input.memberNumber?.trim() || userId;
      const { error: memberError } = await client.from('members').insert({
        auth_user_id: created.user.id,
        member_number: memberNumber,
        full_name: fullName,
        email,
        phone: input.phone?.trim() || null,
      });
      if (memberError) {
        await client.from('profiles').delete().eq('id', created.user.id);
        await client.auth.admin.deleteUser(created.user.id);
        throw new BadRequestException(memberError.code === '23505' ? 'That member number is already in use.' : 'Unable to create the member record.');
      }
    }

    return { id: created.user.id, userId, role: input.role };
  }
}

