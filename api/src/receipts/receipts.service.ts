import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

type Profile = { id: string; role: string };
type PaymentType =
  'monthly_deposit' | 'share_contribution' | 'loan_payment' | 'other';
type ReceiptStatus = 'pending' | 'approved' | 'rejected';
type CreateReceiptInput = {
  amount: string | number;
  paymentType: PaymentType;
  paymentDate: string;
};
type ReceiptReviewFilters = {
  status?: string;
  memberId?: string;
};
type MemberRef = {
  full_name?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
};

const bucket = 'receipts';
const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);
const maxFileSizeBytes = 10 * 1024 * 1024;
const signedUrlTtlSeconds = 60 * 10;

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private async memberIdFor(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id')
      .eq('auth_user_id', profile.id)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to resolve your member profile.',
      );
    if (!data) throw new BadRequestException('Member record not found.');
    return data.id as string;
  }

  private fileNameFrom(fileKey: string) {
    return fileKey.split('/').pop() ?? fileKey;
  }

  private async signedUrlFor(fileKey: string, attempt = 1): Promise<string | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .storage.from(bucket)
      .createSignedUrl(fileKey, signedUrlTtlSeconds);
    if (error) {
      // Supabase storage can briefly lag right after an upload before the
      // object is signable, so retry a couple of times before giving up.
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        return this.signedUrlFor(fileKey, attempt + 1);
      }
      console.error(`Failed to sign receipt file "${fileKey}":`, error);
      return null;
    }
    return data?.signedUrl ?? null;
  }

  private async withSignedUrl(receipt: Record<string, unknown>) {
    const fileKey = receipt.file_key as string;
    return {
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      amount: receipt.amount,
      paymentType: receipt.payment_type,
      paymentDate: receipt.payment_date,
      status: receipt.status,
      submittedAt: receipt.submitted_at,
      rejectionReason: receipt.rejection_reason,
      fileName: this.fileNameFrom(fileKey),
      fileUrl: await this.signedUrlFor(fileKey),
    };
  }

  private async withReviewFields(receipt: Record<string, unknown>) {
    const base = await this.withSignedUrl(receipt);
    const memberField = receipt.members as MemberRef | MemberRef[] | null;
    const member = Array.isArray(memberField) ? memberField[0] : memberField;
    return {
      ...base,
      reviewedAt: (receipt.reviewed_at as string | null) ?? null,
      memberId: receipt.member_id as string,
      memberName: member?.full_name || member?.email || 'Unknown member',
      memberEmail: member?.email ?? null,
    };
  }

  async listForMember(profile: Profile) {
    const memberId = await this.memberIdFor(profile);
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payment_receipts')
      .select(
        'id, receipt_number, amount, payment_type, payment_date, status, submitted_at, rejection_reason, file_key',
      )
      .eq('member_id', memberId)
      .order('submitted_at', { ascending: false });
    if (error)
      throw new InternalServerErrorException('Unable to load your receipts.');
    return Promise.all(
      (data ?? []).map((receipt) => this.withSignedUrl(receipt)),
    );
  }

  async createForMember(
    profile: Profile,
    input: CreateReceiptInput,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('A receipt file is required.');
    if (!allowedMimeTypes.has(file.mimetype))
      throw new BadRequestException(
        'Only PNG, JPG, WEBP, or PDF files are accepted.',
      );
    if (file.size > maxFileSizeBytes)
      throw new BadRequestException('The file must be 10 MB or smaller.');

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Enter a valid amount greater than zero.');
    if (!input.paymentDate)
      throw new BadRequestException('Payment date is required.');
    const paymentType: PaymentType = input.paymentType ?? 'other';

    const memberId = await this.memberIdFor(profile);
    const client = this.supabase.getAdminClient();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `${memberId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(fileKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      console.error('Receipt upload failed:', uploadError);
      throw new InternalServerErrorException(
        `Unable to upload the receipt file: ${uploadError.message}`,
      );
    }

    const { data, error } = await client
      .from('payment_receipts')
      .insert({
        member_id: memberId,
        amount,
        payment_type: paymentType,
        payment_date: input.paymentDate,
        file_key: fileKey,
        status: 'pending',
      })
      .select(
        'id, receipt_number, amount, payment_type, payment_date, status, submitted_at, rejection_reason, file_key',
      )
      .single();

    if (error) {
      await client.storage.from(bucket).remove([fileKey]);
      throw new BadRequestException(error.message);
    }

    await this.audit.log({
      actor: { userId: profile.id, memberId },
      action: 'receipt.submitted',
      entityType: 'receipt',
      entityId: data.id,
      newData: { amount, paymentType, paymentDate: input.paymentDate },
    });

    return this.withSignedUrl(data);
  }

  async listForReview(filters?: ReceiptReviewFilters) {
    const client = this.supabase.getAdminClient();
    let query = client
      .from('payment_receipts')
      .select(
        'id, receipt_number, amount, payment_type, payment_date, status, submitted_at, reviewed_at, rejection_reason, file_key, member_id, members:member_id ( full_name, email, auth_user_id )',
      )
      .order('submitted_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.memberId) query = query.eq('member_id', filters.memberId);

    const { data, error } = await query;
    if (error)
      throw new InternalServerErrorException('Unable to load receipts.');
    return Promise.all(
      (data ?? []).map((receipt) => this.withReviewFields(receipt)),
    );
  }

  async getFileUrl(receiptId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('payment_receipts')
      .select('file_key')
      .eq('id', receiptId)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load the receipt.');
    if (!data) throw new NotFoundException('Receipt not found.');

    const fileKey = data.file_key as string;
    const fileUrl = await this.signedUrlFor(fileKey);
    if (!fileUrl)
      throw new InternalServerErrorException(
        'Unable to generate a link for this file.',
      );
    return { fileUrl, fileName: this.fileNameFrom(fileKey) };
  }

  async approve(profile: Profile, receiptId: string) {
    return this.review(profile, receiptId, 'approved');
  }

  async reject(profile: Profile, receiptId: string, reason: string) {
    if (!reason?.trim())
      throw new BadRequestException('A rejection reason is required.');
    return this.review(profile, receiptId, 'rejected', reason.trim());
  }

  private async review(
    profile: Profile,
    receiptId: string,
    status: Extract<ReceiptStatus, 'approved' | 'rejected'>,
    rejectionReason?: string,
  ) {
    const client = this.supabase.getAdminClient();
    const { data: existing, error: fetchError } = await client
      .from('payment_receipts')
      .select('id, status, members:member_id ( auth_user_id )')
      .eq('id', receiptId)
      .maybeSingle();
    if (fetchError)
      throw new InternalServerErrorException('Unable to load the receipt.');
    if (!existing) throw new NotFoundException('Receipt not found.');
    if (existing.status !== 'pending')
      throw new BadRequestException(
        `This receipt has already been ${existing.status}.`,
      );

    const { data, error } = await client
      .from('payment_receipts')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
      })
      .eq('id', receiptId)
      .select(
        'id, receipt_number, amount, payment_type, payment_date, status, submitted_at, reviewed_at, rejection_reason, file_key, member_id, members:member_id ( full_name, email, auth_user_id )',
      )
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: status === 'approved' ? 'receipt.approved' : 'receipt.rejected',
      entityType: 'receipt',
      entityId: receiptId,
      oldData: { status: existing.status },
      newData: { status, rejectionReason: rejectionReason ?? null },
    });

    const memberField = existing.members as MemberRef | MemberRef[] | null;
    const member = Array.isArray(memberField) ? memberField[0] : memberField;
    const authUserId = member?.auth_user_id;
    if (authUserId) {
      try {
        const origin = process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim();
        await this.notifications.notifyRecipients([authUserId], {
          type: status === 'approved' ? 'receipt_approved' : 'receipt_rejected',
          title:
            status === 'approved'
              ? `Receipt ${data.receipt_number} approved`
              : `Receipt ${data.receipt_number} rejected`,
          message:
            status === 'approved'
              ? `Your receipt ${data.receipt_number} for ${data.amount} has been approved.`
              : `Your receipt ${data.receipt_number} for ${data.amount} was rejected. Reason: ${rejectionReason}`,
          referenceType: 'receipt',
          referenceId: receiptId,
          actionUrl: origin ? `${origin}/member/receipts` : undefined,
          actionLabel: 'View receipt',
        });
      } catch {
        // Notification delivery is best-effort and should never block the review action.
      }
    }

    return this.withReviewFields(data);
  }
}
