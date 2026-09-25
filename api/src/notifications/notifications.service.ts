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
  secondaryUrl?: string;
  secondaryLabel?: string;
};

const BRAND_COLOR = '#1f6752';
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string,
  );
}

function emailButton(url: string, label: string, primary: boolean) {
  const background = primary ? BRAND_COLOR : '#ffffff';
  const color = primary ? '#ffffff' : BRAND_COLOR;
  const border = primary ? BRAND_COLOR : '#dfe8e3';
  return `<td style="border-radius:8px;background-color:${background};border:1px solid ${border}">
      <a href="${escapeHtml(url)}"
        style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:${color};text-decoration:none;border-radius:8px">
        ${escapeHtml(label)}
      </a>
    </td>`;
}

function emailHtml(input: NotifyInput) {
  const buttons = [
    input.actionUrl
      ? emailButton(input.actionUrl, input.actionLabel ?? 'View details', true)
      : '',
    input.secondaryUrl
      ? emailButton(
          input.secondaryUrl,
          input.secondaryLabel ?? 'Open WAFA app',
          !input.actionUrl,
        )
      : '',
  ]
    .filter(Boolean)
    .join('<td style="width:12px">&nbsp;</td>');

  const actions = buttons
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px">
        <tr>${buttons}</tr>
      </table>`
    : '';

  const fallbackLink = input.actionUrl
    ? `<p style="margin-top:18px;font-size:12px;color:#71807a">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${escapeHtml(input.actionUrl)}" style="color:${BRAND_COLOR}">${escapeHtml(input.actionUrl)}</a>
      </p>`
    : '';

  return `<div style="font-family:'DM Sans',Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;border:1px solid #dfe8e3;border-radius:12px;overflow:hidden;background-color:#ffffff">
      <div style="background-color:${BRAND_COLOR};padding:22px 28px">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle">
              <img src="${escapeHtml(FRONTEND_ORIGIN)}/logo.jpeg" alt="WAFA" width="34" height="34" style="display:block;border-radius:8px;background-color:#ffffff" />
            </td>
            <td style="vertical-align:middle;padding-left:12px">
              <span style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#e2f4e8">WAFA workspace</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding:28px">
        <h2 style="font-size:18px;color:#17201d;margin:0 0 12px">${escapeHtml(input.title)}</h2>
        <p style="font-size:14px;line-height:1.6;color:#374151;margin:0">${escapeHtml(input.message)}</p>
        ${actions}
        ${fallbackLink}
      </div>
      <div style="background-color:#f7f8f4;padding:16px 28px;border-top:1px solid #dfe8e3">
        <p style="margin:0;font-size:11px;color:#71807a">© ${new Date().getFullYear()} WAFA · We Are For All · Authorized users only</p>
      </div>
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
