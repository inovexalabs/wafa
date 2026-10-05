import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

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
}

type CertificateRow = {
  id: string;
  certificate_number: string;
  title: string;
  description: string | null;
  file_key: string | null;
  original_filename: string | null;
  file_size: number | null;
  issued_at: string;
};

const bucket = 'certificates';
const allowedMimeTypes = new Set(['image/png']);
export const maxCertificateBytes = 10 * 1024 * 1024;
const signedUrlTtlSeconds = 60 * 60;
const certificateColumns =
  'id, certificate_number, title, description, file_key, original_filename, file_size, issued_at';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async listRecipients(): Promise<CertificateRecipient[]> {
    const client = this.supabase.getAdminClient();
    const [
      { data: staff, error: staffError },
      { data: members, error: membersError },
    ] = await Promise.all([
      client
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['superadmin', 'admin', 'accountant'])
        .order('full_name'),
      client
        .from('members')
        .select('auth_user_id, full_name, email')
        .eq('status', 'active')
        .order('full_name'),
    ]);
    if (staffError || membersError)
      throw new InternalServerErrorException('Unable to load recipients.');

    const staffRecipients: CertificateRecipient[] = (staff ?? []).map(
      (row) => ({
        id: row.id,
        fullName: row.full_name || row.email,
        email: row.email,
        role: row.role as RecipientRole,
      }),
    );
    const memberRecipients: CertificateRecipient[] = (members ?? []).map(
      (row) => ({
        id: row.auth_user_id,
        fullName: row.full_name,
        email: row.email,
        role: 'member' as const,
      }),
    );
    return [...staffRecipients, ...memberRecipients];
  }

  async issue(
    profile: Profile,
    input: CreateCertificateInput,
    file?: Express.Multer.File,
  ) {
    if (!profile) throw new ForbiddenException('Authentication is required.');
    if (!input?.recipientId?.trim() || !input?.title?.trim()) {
      throw new BadRequestException('recipientId and title are required.');
    }
    if (input.title.trim().length > 200)
      throw new BadRequestException('Title must be 200 characters or fewer.');
    if (!file) throw new BadRequestException('A certificate PNG is required.');
    if (!allowedMimeTypes.has(file.mimetype))
      throw new BadRequestException('Only PNG certificates are accepted.');
    if (file.size > maxCertificateBytes)
      throw new BadRequestException(
        'The certificate must be 10 MB or smaller.',
      );

    const client = this.supabase.getAdminClient();
    const { data: recipient, error: recipientError } = await client
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', input.recipientId.trim())
      .maybeSingle();
    if (recipientError)
      throw new InternalServerErrorException('Unable to verify the recipient.');
    if (!recipient)
      throw new BadRequestException('The selected recipient does not exist.');

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `${recipient.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(fileKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      this.logger.error(`upload: ${uploadError.message}`, uploadError);
      throw new InternalServerErrorException(
        'Unable to upload this certificate.',
      );
    }

    const { data, error } = await client
      .from('certificates')
      .insert({
        profile_id: recipient.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        file_key: fileKey,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        issued_by: profile.id,
      })
      .select(certificateColumns)
      .single();
    if (error) {
      await this.removeFiles([fileKey]);
      throw new BadRequestException(error.message);
    }

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'certificate.issued',
      entityType: 'certificate',
      entityId: data.id,
      newData: {
        recipientId: recipient.id,
        recipientName: recipient.full_name,
        title: data.title,
        certificateNumber: data.certificate_number,
      },
    });

    try {
      const origin = process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim();
      const certificatesPath =
        recipient.role === 'member'
          ? '/member/certificates'
          : '/admin/certificates';
      await this.notifications.notifyRecipients([recipient.id], {
        type: 'system',
        title: `New certificate: ${data.title}`,
        message: `You have been issued a new certificate: "${data.title}" (${data.certificate_number}).`,
        referenceType: 'certificate',
        referenceId: data.id,
        actionUrl: origin ? `${origin}${certificatesPath}` : undefined,
        actionLabel: 'View certificate',
      });
    } catch {
      // Notification delivery is best-effort and should never block certificate issuance.
    }

    const [certificate] = await this.withImageUrls([data]);
    return certificate;
  }

  async remove(profile: Profile, id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('certificates')
      .delete()
      .eq('id', id)
      .select('id, certificate_number, title, file_key, profile_id')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Certificate not found.');
    if (data.file_key) await this.removeFiles([data.file_key]);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'certificate.deleted',
      entityType: 'certificate',
      entityId: data.id,
      oldData: {
        recipientId: data.profile_id,
        title: data.title,
        certificateNumber: data.certificate_number,
      },
    });

    return { success: true };
  }

  async listAll() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('certificates')
      .select(
        `${certificateColumns}, profiles:profile_id ( full_name, user_id, role )`,
      )
      .order('issued_at', { ascending: false });
    if (error)
      throw new InternalServerErrorException('Unable to load certificates.');
    const certificates = await this.withImageUrls(data ?? []);
    return (data ?? []).map((row, index) => {
      const profile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;
      return {
        ...certificates[index],
        recipientName:
          profile?.full_name || profile?.user_id || 'Unknown recipient',
        recipientRole: (profile?.role ?? 'member') as RecipientRole,
      };
    });
  }

  async listForProfile(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('certificates')
      .select(certificateColumns)
      .eq('profile_id', profile.id)
      .order('issued_at', { ascending: false });
    if (error)
      throw new InternalServerErrorException(
        'Unable to load your certificates.',
      );
    return this.withImageUrls(data ?? []);
  }

  /** Map rows to API shape, attaching a short-lived signed URL for each certificate image (null for pre-PNG certificates). */
  private async withImageUrls(rows: CertificateRow[]) {
    const fileKeys = rows
      .map((row) => row.file_key)
      .filter((key): key is string => !!key);
    const urls = new Map<string | null, string>();
    if (fileKeys.length) {
      const { data: signed, error } = await this.supabase
        .getAdminClient()
        .storage.from(bucket)
        .createSignedUrls(fileKeys, signedUrlTtlSeconds);
      if (error) this.logger.warn(`createSignedUrls: ${error.message}`);
      for (const entry of signed ?? [])
        if (entry.path && entry.signedUrl)
          urls.set(entry.path, entry.signedUrl);
    }
    return rows.map((row) => ({
      id: row.id,
      certificateNumber: row.certificate_number,
      title: row.title,
      description: row.description,
      originalFilename: row.original_filename,
      fileSize: row.file_size === null ? null : Number(row.file_size),
      imageUrl: urls.get(row.file_key) ?? null,
      issuedAt: row.issued_at,
    }));
  }

  private async removeFiles(fileKeys: string[]) {
    const { error } = await this.supabase
      .getAdminClient()
      .storage.from(bucket)
      .remove(fileKeys);
    // A leftover object only costs storage; never fail the request over it.
    if (error) this.logger.warn(`removeFiles: ${error.message}`);
  }
}
