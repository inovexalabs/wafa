import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };
type PaymentType =
  'monthly_deposit' | 'share_contribution' | 'loan_payment' | 'other';
type CreateReceiptInput = {
  amount: string | number;
  paymentType: PaymentType;
  paymentDate: string;
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

  private async withSignedUrl(receipt: Record<string, unknown>) {
    const fileKey = receipt.file_key as string;
    const { data } = await this.supabase
      .getAdminClient()
      .storage.from(bucket)
      .createSignedUrl(fileKey, signedUrlTtlSeconds);
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
      fileUrl: data?.signedUrl ?? null,
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
        'Unable to upload the receipt file.',
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
}
