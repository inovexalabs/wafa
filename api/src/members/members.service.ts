import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class MembersService {
  constructor(private readonly supabase: SupabaseService) {}

  async listActive() {
    const { data, error } = await this.supabase.getAdminClient().from('members').select('id, full_name, member_number, email').eq('status', 'active').order('full_name', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load members.');
    return data ?? [];
  }
}
