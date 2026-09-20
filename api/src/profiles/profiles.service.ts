import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

type Profile = { id: string; role: string };
type UpdateOwnProfileInput = { fullName?: string; phone?: string };

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOwn(profile: Profile) {
    const { data, error } = await this.supabase.getAdminClient().from('profiles')
      .select('id, user_id, email, role, full_name, phone, created_at').eq('id', profile.id).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to load your profile.');
    if (!data) throw new NotFoundException('Profile not found.');

    return {
      id: data.id,
      userId: data.user_id,
      email: data.email,
      role: data.role,
      fullName: data.full_name,
      phone: data.phone,
      joinedAt: data.created_at,
    };
  }

  async updateOwn(profile: Profile, input: UpdateOwnProfileInput) {
    const fullName = input.fullName?.trim();
    const phone = input.phone?.trim();
    if (fullName === '') throw new BadRequestException('Full name cannot be empty.');

    if (fullName !== undefined || phone !== undefined) {
      const { error } = await this.supabase.getAdminClient().from('profiles').update({
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      }).eq('id', profile.id);
      if (error) throw new BadRequestException(error.message);
    }

    return this.getOwn(profile);
  }
}
