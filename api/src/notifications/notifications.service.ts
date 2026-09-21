import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { ResendService } from './resend.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };
type NotificationType =
  | 'loan_due'
  | 'payment_due'
  | 'receipt_approved'
  | 'receipt_rejected'
  | 'meeting'
  | 'dividend'
  | 'system';
type Recipient = { id: string; email: string | null };
type NotifyInput = {
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  actionLabel?: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string,
  );
}

function emailHtml(input: NotifyInput) {
  const button = input.actionUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr>
          <td style="border-radius:6px;background-color:#111827">
            <a href="${escapeHtml(input.actionUrl)}"
              style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px">
              ${escapeHtml(input.actionLabel ?? 'View details')}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#6b7280">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${escapeHtml(input.actionUrl)}" style="color:#2563eb">${escapeHtml(input.actionUrl)}</a>
      </p>`
    : '';

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto">
      <h2 style="font-size:18px;color:#111827;margin-bottom:12px">${escapeHtml(input.title)}</h2>
      <p style="font-size:14px;line-height:1.5;color:#374151">${escapeHtml(input.message)}</p>
      ${button}
    </div>`;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly resend: ResendService,
    private readonly audit: AuditService,
  ) {}

  async list(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('notifications')
      .select(
        'id, type, title, message, reference_type, reference_id, read_at, created_at',
      )
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error)
      throw new InternalServerErrorException('Unable to load notifications.');
    return data ?? [];
  }

  async unreadCount(profile: Profile) {
    const { count, error } = await this.supabase
      .getAdminClient()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .is('read_at', null);
    if (error)
      throw new InternalServerErrorException('Unable to load unread count.');
    return { count: count ?? 0 };
  }

  async markRead(profile: Profile, notificationId: string) {
    const { error } = await this.supabase
      .getAdminClient()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('profile_id', profile.id);
    if (error)
      throw new InternalServerErrorException(
        'Unable to update this notification.',
      );
    return { id: notificationId };
  }

  async markAllRead(profile: Profile) {
    const { error } = await this.supabase
      .getAdminClient()
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('profile_id', profile.id)
      .is('read_at', null);
    if (error)
      throw new InternalServerErrorException('Unable to update notifications.');
    return { ok: true };
  }

  private async resolveRecipients(
    recipientIds?: string[],
  ): Promise<Recipient[]> {
    const client = this.supabase.getAdminClient();
    const requestedIds = Array.from(new Set(recipientIds ?? [])).filter(
      Boolean,
    );
    const query = client.from('profiles').select('id, email');
    const { data, error } = requestedIds.length
      ? await query.in('id', requestedIds)
      : await query;
    if (error)
      throw new InternalServerErrorException('Unable to resolve recipients.');
    return data ?? [];
  }

  private async createForRecipients(
    recipients: Recipient[],
    input: NotifyInput,
  ) {
    if (!recipients.length) return { sentTo: 0 };
    const client = this.supabase.getAdminClient();
    const rows = recipients.map((recipient) => ({
      profile_id: recipient.id,
      type: input.type,
      title: input.title,
      message: input.message,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
    }));
    const { data, error } = await client
      .from('notifications')
      .insert(rows)
      .select('id, profile_id');
    if (error)
      throw new InternalServerErrorException('Unable to create notifications.');
    const created = data ?? [];

    const inAppDeliveries = created.map((notification) => ({
      notification_id: notification.id,
      channel: 'in_app' as const,
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
    }));
    if (inAppDeliveries.length)
      await client.from('notification_deliveries').insert(inAppDeliveries);

    if (this.resend.hasCredentials()) {
      const emailByProfile = new Map(
        recipients.map((recipient) => [recipient.id, recipient.email]),
      );
      await Promise.all(
        created.map(async (notification) => {
          const email = emailByProfile.get(notification.profile_id);
          if (!email) return;
          try {
            const providerMessageId = await this.resend.send(
              email,
              input.title,
              emailHtml(input),
            );
            await client.from('notification_deliveries').insert({
              notification_id: notification.id,
              channel: 'email',
              status: 'sent',
              sent_at: new Date().toISOString(),
              provider_message_id: providerMessageId,
            });
          } catch (sendError) {
            await client.from('notification_deliveries').insert({
              notification_id: notification.id,
              channel: 'email',
              status: 'failed',
              failed_at: new Date().toISOString(),
              error_message:
                sendError instanceof Error
                  ? sendError.message
                  : 'Unknown error',
            });
          }
        }),
      );
    }

    return { sentTo: created.length };
  }

  async announce(
    input: { title: string; message: string; recipientIds?: string[] },
    actor?: Profile,
  ) {
    if (!input.title?.trim() || !input.message?.trim())
      throw new BadRequestException('Title and message are required.');
    const recipients = await this.resolveRecipients(input.recipientIds);
    const result = await this.createForRecipients(recipients, {
      type: 'system',
      title: input.title.trim(),
      message: input.message.trim(),
    });

    await this.audit.log({
      actor: actor ? { userId: actor.id } : undefined,
      action: 'notification.announced',
      entityType: 'notification',
      newData: { title: input.title.trim(), sentTo: result.sentTo },
    });

    return result;
  }

  async notifyRecipients(
    recipientIds: string[] | undefined,
    input: NotifyInput,
  ) {
    const recipients = await this.resolveRecipients(recipientIds);
    return this.createForRecipients(recipients, input);
  }
}
