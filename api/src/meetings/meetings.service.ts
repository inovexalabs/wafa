import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { ZoomService } from '../zoom/zoom.service';
import { NotificationsService } from '../notifications/notifications.service';

type MeetingInput = {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingType?: 'online' | 'physical' | 'hybrid';
  meetingUrl?: string;
  recipientIds?: string[];
};
type Profile = { id: string; role: string };
type MeetingTiming = {
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
};
type RecipientRole = 'superadmin' | 'admin' | 'accountant' | 'member';
export type MeetingRecipient = {
  id: string;
  fullName: string;
  email: string | null;
  role: RecipientRole;
};

@Injectable()
export class MeetingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly zoom: ZoomService,
    private readonly notifications: NotificationsService,
  ) {}

  private async zoomMeeting(input: MeetingInput) {
    if (!this.zoom.hasCredentials()) return null;
    try {
      return await this.zoom.createMeeting({
        topic: input.title,
        startTime: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        agenda: input.description,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create the Zoom meeting.';
      throw new InternalServerErrorException(message);
    }
  }

  private hasEnded(meeting: MeetingTiming) {
    const durationMs = (meeting.duration_minutes ?? 60) * 60 * 1000;
    return Date.now() > new Date(meeting.scheduled_at).getTime() + durationMs;
  }

  private async getMeetingOrThrow(meetingId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('meetings')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('id', meetingId)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load the meeting.');
    if (!data) throw new NotFoundException('Meeting not found.');
    return data;
  }

  private assertMutable(meeting: MeetingTiming) {
    if (meeting.status === 'cancelled')
      throw new BadRequestException('This meeting has been cancelled.');
    if (this.hasEnded(meeting))
      throw new ForbiddenException(
        'This meeting has already ended and can no longer be modified.',
      );
  }

  async list(profile: Profile) {
    const client = this.supabase.getAdminClient();
    const { data: meetings, error } = await client
      .from('meetings')
      .select(
        'id, title, description, meeting_type, scheduled_at, duration_minutes, meeting_url, status',
      )
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true });
    if (error)
      throw new InternalServerErrorException('Unable to load meetings.');
    if (profile.role !== 'member') return meetings ?? [];

    const { data: shares, error: sharesError } = await client
      .from('meeting_notifications')
      .select('meeting_id, profile_id');
    if (sharesError)
      throw new InternalServerErrorException(
        'Unable to load meeting visibility.',
      );

    const targetedMeetingIds = new Set(
      (shares ?? []).map((share) => share.meeting_id),
    );
    const sharedWithMeIds = new Set(
      (shares ?? [])
        .filter((share) => share.profile_id === profile.id)
        .map((share) => share.meeting_id),
    );

    return (meetings ?? []).filter(
      (meeting) =>
        !targetedMeetingIds.has(meeting.id) || sharedWithMeIds.has(meeting.id),
    );
  }

  async listRecipients(): Promise<MeetingRecipient[]> {
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

    const staffRecipients: MeetingRecipient[] = (staff ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name || row.email,
      email: row.email,
      role: row.role as RecipientRole,
    }));
    const memberRecipients: MeetingRecipient[] = (members ?? []).map((row) => ({
      id: row.auth_user_id,
      fullName: row.full_name,
      email: row.email,
      role: 'member',
    }));
    return [...staffRecipients, ...memberRecipients];
  }

  async create(profile: Profile, input: MeetingInput) {
    if (!input?.title?.trim() || !input.scheduledAt)
      throw new BadRequestException('Title and scheduledAt are required.');
    const zoom = input.meetingUrl ? null : await this.zoomMeeting(input);
    const meetingUrl = input.meetingUrl?.trim() || zoom?.joinUrl || null;
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('meetings')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        meeting_type: input.meetingType ?? 'online',
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes ?? 60,
        meeting_url: meetingUrl,
        status: 'scheduled',
        created_by: profile.id,
      })
      .select(
        'id, title, description, meeting_type, scheduled_at, duration_minutes, meeting_url, status',
      )
      .single();
    if (error) throw new BadRequestException(error.message);

    const recipientIds = Array.from(new Set(input.recipientIds ?? [])).filter(
      Boolean,
    );
    if (recipientIds.length) {
      const shareRows = recipientIds.map((profileId) => ({
        meeting_id: data.id,
        profile_id: profileId,
        notification_type: 'in_app' as const,
        status: 'pending' as const,
      }));
      const { error: shareError } = await this.supabase
        .getAdminClient()
        .from('meeting_notifications')
        .insert(shareRows);
      if (shareError)
        throw new BadRequestException(
          `Meeting was created, but sharing it with the selected recipients failed: ${shareError.message}`,
        );
    }

    try {
      await this.notifications.notifyRecipients(
        recipientIds.length ? recipientIds : undefined,
        {
          type: 'meeting',
          title: `New meeting: ${data.title}`,
          message: `${data.title} is scheduled for ${new Date(data.scheduled_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`,
          referenceType: 'meeting',
          referenceId: data.id,
        },
      );
    } catch {
      // Notification delivery is best-effort and should never block meeting creation.
    }

    return {
      ...data,
      zoomMeetingId: zoom?.id ?? null,
      hostUrl: zoom?.startUrl ?? null,
      sharedWithCount: recipientIds.length,
    };
  }

  async sharedRecipientIds(meetingId: string) {
    await this.getMeetingOrThrow(meetingId);
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('meeting_notifications')
      .select('profile_id')
      .eq('meeting_id', meetingId);
    if (error)
      throw new InternalServerErrorException('Unable to load meeting shares.');
    return Array.from(new Set((data ?? []).map((row) => row.profile_id)));
  }

  async update(
    meetingId: string,
    input: Partial<
      Pick<
        MeetingInput,
        | 'title'
        | 'description'
        | 'scheduledAt'
        | 'durationMinutes'
        | 'meetingType'
      >
    >,
  ) {
    const meeting = await this.getMeetingOrThrow(meetingId);
    this.assertMutable(meeting);

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) {
      if (!input.title.trim())
        throw new BadRequestException('Title cannot be empty.');
      patch.title = input.title.trim();
    }
    if (input.description !== undefined)
      patch.description = input.description?.trim() || null;
    if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
    if (input.durationMinutes !== undefined)
      patch.duration_minutes = input.durationMinutes;
    if (input.meetingType !== undefined) patch.meeting_type = input.meetingType;

    if (!Object.keys(patch).length)
      throw new BadRequestException('Nothing to update.');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('meetings')
      .update(patch)
      .eq('id', meetingId)
      .select(
        'id, title, description, meeting_type, scheduled_at, duration_minutes, meeting_url, status',
      )
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async setRecipients(meetingId: string, recipientIds: string[]) {
    const meeting = await this.getMeetingOrThrow(meetingId);
    this.assertMutable(meeting);

    const requestedIds = Array.from(new Set(recipientIds ?? [])).filter(
      Boolean,
    );
    const client = this.supabase.getAdminClient();
    const { data: existing, error: existingError } = await client
      .from('meeting_notifications')
      .select('profile_id')
      .eq('meeting_id', meetingId);
    if (existingError)
      throw new InternalServerErrorException(
        'Unable to check existing shares.',
      );

    const existingIds = new Set((existing ?? []).map((row) => row.profile_id));
    const requestedSet = new Set(requestedIds);

    const toAdd = requestedIds.filter((id) => !existingIds.has(id));
    const toRemove = Array.from(existingIds).filter(
      (id) => !requestedSet.has(id),
    );

    if (toRemove.length) {
      const { error } = await client
        .from('meeting_notifications')
        .delete()
        .eq('meeting_id', meetingId)
        .in('profile_id', toRemove);
      if (error) throw new BadRequestException(error.message);
    }
    if (toAdd.length) {
      const shareRows = toAdd.map((profileId) => ({
        meeting_id: meetingId,
        profile_id: profileId,
        notification_type: 'in_app' as const,
        status: 'pending' as const,
      }));
      const { error } = await client
        .from('meeting_notifications')
        .insert(shareRows);
      if (error) throw new BadRequestException(error.message);
    }

    return { recipientIds: requestedIds };
  }

  async cancel(meetingId: string) {
    const meeting = await this.getMeetingOrThrow(meetingId);
    this.assertMutable(meeting);
    const { error } = await this.supabase
      .getAdminClient()
      .from('meetings')
      .update({ status: 'cancelled' })
      .eq('id', meetingId);
    if (error) throw new BadRequestException(error.message);
    return { id: meetingId, status: 'cancelled' };
  }
}
