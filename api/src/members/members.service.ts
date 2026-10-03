import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { joinedAtFromDate } from './joined-at.util';

type Profile = { id: string; role: string };
type UpdateOwnProfileInput = {
  fullName?: string;
  phone?: string;
  address?: string;
  occupation?: string;
};

@Injectable()
export class MembersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listActive() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id, full_name, member_number, email')
      .eq('status', 'active')
      .order('full_name', { ascending: true });
    if (error)
      throw new InternalServerErrorException('Unable to load members.');
    return data ?? [];
  }

  // Every member with their joining date and how complete their documents are,
  // for the superadmin member directory.
  async directory() {
    const client = this.supabase.getAdminClient();
    const [
      { data: members, error: membersError },
      { data: types, error: typesError },
      { data: documents, error: documentsError },
    ] = await Promise.all([
      client
        .from('members')
        .select('id, member_number, full_name, email, phone, status, joined_at')
        .order('full_name', { ascending: true }),
      client.from('member_document_types').select('id, name, is_required'),
      client.from('member_documents').select('member_id, document_type_id'),
    ]);
    if (membersError || typesError || documentsError)
      throw new InternalServerErrorException('Unable to load members.');

    const uploadedByMember = new Map<string, Set<string>>();
    for (const row of documents ?? []) {
      const uploaded = uploadedByMember.get(row.member_id) ?? new Set<string>();
      uploaded.add(row.document_type_id);
      uploadedByMember.set(row.member_id, uploaded);
    }
    const allTypes = types ?? [];
    const requiredTypes = allTypes.filter((type) => type.is_required);

    return (members ?? []).map((member) => {
      const uploaded = uploadedByMember.get(member.id) ?? new Set<string>();
      return {
        id: member.id,
        memberNumber: member.member_number,
        fullName: member.full_name,
        email: member.email,
        phone: member.phone,
        status: member.status,
        joinedAt: member.joined_at,
        documentsUploaded: allTypes.filter((type) => uploaded.has(type.id))
          .length,
        documentsTotal: allTypes.length,
        missingRequired: requiredTypes
          .filter((type) => !uploaded.has(type.id))
          .map((type) => type.name),
      };
    });
  }

  async updateJoinedAt(actor: Profile, memberId: string, date: string) {
    const joinedAt = joinedAtFromDate(date);
    const client = this.supabase.getAdminClient();
    const { data: existing, error: fetchError } = await client
      .from('members')
      .select('id, joined_at')
      .eq('id', memberId)
      .maybeSingle();
    if (fetchError)
      throw new InternalServerErrorException('Unable to load this member.');
    if (!existing) throw new NotFoundException('Member not found.');

    const { error } = await client
      .from('members')
      .update({ joined_at: joinedAt })
      .eq('id', memberId);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: actor.id },
      action: 'member.joined_at_updated',
      entityType: 'member',
      entityId: memberId,
      oldData: { joinedAt: existing.joined_at },
      newData: { joinedAt },
    });

    return { id: memberId, joinedAt };
  }

  private async memberRowFor(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id, member_number, full_name, email, phone, status, joined_at')
      .eq('auth_user_id', profile.id)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to load your member record.',
      );
    if (!data) throw new NotFoundException('Member record not found.');
    return data;
  }

  async getOwnProfile(profile: Profile) {
    const member = await this.memberRowFor(profile);
    const { data: memberProfile, error } = await this.supabase
      .getAdminClient()
      .from('member_profiles')
      .select('address, occupation, date_of_birth, emergency_contact')
      .eq('member_id', member.id)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to load your profile details.',
      );

    return {
      id: member.id,
      memberNumber: member.member_number,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      status: member.status,
      joinedAt: member.joined_at,
      address: memberProfile?.address ?? null,
      occupation: memberProfile?.occupation ?? null,
      dateOfBirth: memberProfile?.date_of_birth ?? null,
      emergencyContact: memberProfile?.emergency_contact ?? null,
    };
  }

  async updateOwnProfile(profile: Profile, input: UpdateOwnProfileInput) {
    const member = await this.memberRowFor(profile);
    const client = this.supabase.getAdminClient();

    const fullName = input.fullName?.trim();
    const phone = input.phone?.trim();
    if (fullName !== undefined || phone !== undefined) {
      if (fullName === '')
        throw new BadRequestException('Full name cannot be empty.');
      const { error } = await client
        .from('members')
        .update({
          ...(fullName !== undefined ? { full_name: fullName } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
        })
        .eq('id', member.id);
      if (error) throw new BadRequestException(error.message);
    }

    if (input.address !== undefined || input.occupation !== undefined) {
      const { error } = await client.from('member_profiles').upsert(
        {
          member_id: member.id,
          ...(input.address !== undefined
            ? { address: input.address?.trim() || null }
            : {}),
          ...(input.occupation !== undefined
            ? { occupation: input.occupation?.trim() || null }
            : {}),
        },
        { onConflict: 'member_id' },
      );
      if (error) throw new BadRequestException(error.message);
    }

    await this.audit.log({
      actor: { userId: profile.id, memberId: member.id },
      action: 'member.profile_updated',
      entityType: 'member',
      entityId: member.id,
      newData: input,
    });

    return this.getOwnProfile(profile);
  }
}
