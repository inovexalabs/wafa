import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { ZoomService } from '../zoom/zoom.service';

type MeetingInput = { title: string; description?: string; scheduledAt: string; durationMinutes?: number; meetingType?: 'online' | 'physical' | 'hybrid'; meetingUrl?: string; memberIds?: string[] };
type Profile = { id: string; role: string };
type MeetingTiming = { scheduled_at: string; duration_minutes: number | null; status: string };

@Injectable()
export class MeetingsService {
  constructor(private readonly supabase: SupabaseService, private readonly zoom: ZoomService) {}

  private async zoomMeeting(input: MeetingInput) {
    if (!this.zoom.hasCredentials()) return null;
    try {
      return await this.zoom.createMeeting({ topic: input.title, startTime: input.scheduledAt, durationMinutes: input.durationMinutes, agenda: input.description });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the Zoom meeting.';
      throw new InternalServerErrorException(message);
    }
  }

  private async memberIdFor(profile: Profile) {
    const { data, error } = await this.supabase.getAdminClient().from('members').select('id').eq('auth_user_id', profile.id).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to resolve your member profile.');
    return data?.id ?? null;
  }

  private hasEnded(meeting: MeetingTiming) {
    const durationMs = (meeting.duration_minutes ?? 60) * 60 * 1000;
    return Date.now() > new Date(meeting.scheduled_at).getTime() + durationMs;
  }

  private async getMeetingOrThrow(meetingId: string) {
    const { data, error } = await this.supabase.getAdminClient().from('meetings').select('id, scheduled_at, duration_minutes, status').eq('id', meetingId).maybeSingle();
    if (error) throw new InternalServerErrorException('Unable to load the meeting.');
    if (!data) throw new NotFoundException('Meeting not found.');
    return data;
  }

  private assertMutable(meeting: MeetingTiming) {
    if (meeting.status === 'cancelled') throw new BadRequestException('This meeting has been cancelled.');
    if (this.hasEnded(meeting)) throw new ForbiddenException('This meeting has already ended and can no longer be modified.');
  }

  async list(profile: Profile) {
    const client = this.supabase.getAdminClient();
    const { data: meetings, error } = await client.from('meetings').select('id, title, description, meeting_type, scheduled_at, duration_minutes, meeting_url, status').neq('status', 'cancelled').order('scheduled_at', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load meetings.');
    if (profile.role !== 'member') return meetings ?? [];

    const memberId = await this.memberIdFor(profile);
    if (!memberId) return [];

    const { data: shares, error: sharesError } = await client.from('meeting_notifications').select('meeting_id, member_id');
    if (sharesError) throw new InternalServerErrorException('Unable to load meeting visibility.');

    const targetedMeetingIds = new Set((shares ?? []).map((share) => share.meeting_id));
    const sharedWithMeIds = new Set((shares ?? []).filter((share) => share.member_id === memberId).map((share) => share.meeting_id));

    return (meetings ?? []).filter((meeting) => !targetedMeetingIds.has(meeting.id) || sharedWithMeIds.has(meeting.id));
  }

  async create(profile: Profile, input: MeetingInput) {
    if (!input?.title?.trim() || !input.scheduledAt) throw new BadRequestException('Title and scheduledAt are required.');
    const zoom = input.meetingUrl ? null : await this.zoomMeeting(input);
    const meetingUrl = input.meetingUrl?.trim() || zoom?.joinUrl || null;
    const { data, error } = await this.supabase.getAdminClient().from('meetings').insert({ title: input.title.trim(), description: input.description?.trim() || null, meeting_type: input.meetingType ?? 'online', scheduled_at: input.scheduledAt, duration_minutes: input.durationMinutes ?? 60, meeting_url: meetingUrl, status: 'scheduled', created_by: profile.id }).select('id, title, description, meeting_type, scheduled_at, duration_minutes, meeting_url, status').single();
    if (error) throw new BadRequestException(error.message);

    const memberIds = Array.from(new Set(input.memberIds ?? [])).filter(Boolean);
    if (memberIds.length) {
      const shareRows = memberIds.map((memberId) => ({ meeting_id: data.id, member_id: memberId, notification_type: 'in_app' as const, status: 'pending' as const }));
      const { error: shareError } = await this.supabase.getAdminClient().from('meeting_notifications').insert(shareRows);
      if (shareError) throw new BadRequestException(`Meeting was created, but sharing it with the selected members failed: ${shareError.message}`);
    }

    return { ...data, zoomMeetingId: zoom?.id ?? null, hostUrl: zoom?.startUrl ?? null, sharedWithCount: memberIds.length };
  }

  async sharedMemberIds(meetingId: string) {
    await this.getMeetingOrThrow(meetingId);
    const { data, error } = await this.supabase.getAdminClient().from('meeting_notifications').select('member_id').eq('meeting_id', meetingId);
    if (error) throw new InternalServerErrorException('Unable to load meeting shares.');
    return Array.from(new Set((data ?? []).map((row) => row.member_id)));
  }

  async addMembers(meetingId: string, memberIds: string[]) {
    const meeting = await this.getMeetingOrThrow(meetingId);
    this.assertMutable(meeting);

    const requestedIds = Array.from(new Set(memberIds ?? [])).filter(Boolean);
    if (!requestedIds.length) throw new BadRequestException('Select at least one member to share with.');

    const client = this.supabase.getAdminClient();
    const { data: existing, error: existingError } = await client.from('meeting_notifications').select('member_id').eq('meeting_id', meetingId);
    if (existingError) throw new InternalServerErrorException('Unable to check existing shares.');

    const alreadyShared = new Set((existing ?? []).map((row) => row.member_id));
    const newIds = requestedIds.filter((id) => !alreadyShared.has(id));
    if (!newIds.length) return { added: 0 };

    const shareRows = newIds.map((memberId) => ({ meeting_id: meetingId, member_id: memberId, notification_type: 'in_app' as const, status: 'pending' as const }));
    const { error } = await client.from('meeting_notifications').insert(shareRows);
    if (error) throw new BadRequestException(error.message);
    return { added: newIds.length };
  }

  async cancel(meetingId: string) {
    const meeting = await this.getMeetingOrThrow(meetingId);
    this.assertMutable(meeting);
    const { error } = await this.supabase.getAdminClient().from('meetings').update({ status: 'cancelled' }).eq('id', meetingId);
    if (error) throw new BadRequestException(error.message);
    return { id: meetingId, status: 'cancelled' };
  }
}
