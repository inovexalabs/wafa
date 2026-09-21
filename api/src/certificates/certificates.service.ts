import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

type Profile = { id: string; role: string };
type RecipientRole = 'superadmin' | 'admin' | 'accountant' | 'member';

export interface CertificateRecipient {
  id: string;
  fullName: string;
  email: string | null;
  role: RecipientRole;
}

export interface CreateCertificateInput {
  recipientId: string;
  title: string;
  description?: string;
  templateHtml: string;
}

const maxTemplateLength = 200_000;

@Injectable()
export class CertificatesService {
  constructor(private readonly supabase: SupabaseService) {}

  async listRecipients(): Promise<CertificateRecipient[]> {
    const client = this.supabase.getAdminClient();
    const [{ data: staff, error: staffError }, { data: members, error: membersError }] = await Promise.all([
      client.from('profiles').select('id, full_name, email, role').in('role', ['superadmin', 'admin', 'accountant']).order('full_name'),
      client.from('members').select('auth_user_id, full_name, email').eq('status', 'active').order('full_name'),
    ]);
    if (staffError || membersError) throw new InternalServerErrorException('Unable to load recipients.');

    const staffRecipients: CertificateRecipient[] = (staff ?? []).map((row) => ({ id: row.id, fullName: row.full_name || row.email, email: row.email, role: row.role as RecipientRole }));
    const memberRecipients: CertificateRecipient[] = (members ?? []).map((row) => ({ id: row.auth_user_id, fullName: row.full_name, email: row.email, role: 'member' as const }));
    return [...staffRecipients, ...memberRecipients];
  }

  async issue(profile: Profile, input: CreateCertificateInput) {
    if (!profile) throw new ForbiddenException('Authentication is required.');
    if (!input?.recipientId?.trim() || !input?.title?.trim() || !input?.templateHtml?.trim()) {
      throw new BadRequestException('recipientId, title, and templateHtml are required.');
    }
    const templateHtml = input.templateHtml.trim();
    if (templateHtml.length > maxTemplateLength) {
      throw new BadRequestException('The certificate HTML is too large.');
    }

    const client = this.supabase.getAdminClient();
    const { data: recipient, error: recipientError } = await client.from('profiles')
      .select('id').eq('id', input.recipientId.trim()).maybeSingle();
    if (recipientError) throw new InternalServerErrorException('Unable to verify the recipient.');
    if (!recipient) throw new BadRequestException('The selected recipient does not exist.');

    const { data, error } = await client.from('certificates').insert({
      profile_id: recipient.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      template_html: templateHtml,
      issued_by: profile.id,
    }).select('id, certificate_number, title, description, template_html, issued_at').single();
    if (error) throw new BadRequestException(error.message);

    return this.mapCertificate(data);
  }

  async listAll() {
    const { data, error } = await this.supabase.getAdminClient().from('certificates')
      .select('id, certificate_number, title, description, template_html, issued_at, profiles:profile_id ( full_name, user_id, role )')
      .order('issued_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Unable to load certificates.');
    return (data ?? []).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        ...this.mapCertificate(row),
        recipientName: profile?.full_name || profile?.user_id || 'Unknown recipient',
        recipientRole: (profile?.role ?? 'member') as RecipientRole,
      };
    });
  }

  async listForProfile(profile: Profile) {
    const { data, error } = await this.supabase.getAdminClient().from('certificates')
      .select('id, certificate_number, title, description, template_html, issued_at')
      .eq('profile_id', profile.id)
      .order('issued_at', { ascending: false });
    if (error) throw new InternalServerErrorException('Unable to load your certificates.');
    return (data ?? []).map((row) => this.mapCertificate(row));
  }

  private mapCertificate(row: { id: string; certificate_number: string; title: string; description: string | null; template_html: string; issued_at: string }) {
    return {
      id: row.id,
      certificateNumber: row.certificate_number,
      title: row.title,
      description: row.description,
      templateHtml: row.template_html,
      issuedAt: row.issued_at,
    };
  }
}
