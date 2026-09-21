import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

type Profile = { id: string; role: string };

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

const maxMessageLength = 4000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async list(after?: string): Promise<ChatMessage[]> {
    const client = this.supabase.getAdminClient();
    let query = client
      .from('chat_messages')
      .select('id, sender_id, content, created_at')
      .order('created_at', { ascending: true })
      .limit(200);
    if (after) query = query.gt('created_at', after);

    const { data, error } = await query;
    if (error) {
      this.logger.error(`list: ${error.message}`, error);
      throw new InternalServerErrorException('Unable to load messages.');
    }
    const rows = data ?? [];
    if (!rows.length) return [];

    const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)));
    const { data: senders, error: sendersError } = await client
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', senderIds);
    if (sendersError) {
      this.logger.error(`list senders: ${sendersError.message}`, sendersError);
      throw new InternalServerErrorException('Unable to load senders.');
    }
    const senderById = new Map((senders ?? []).map((sender) => [sender.id, sender]));

    return rows.map((row) => {
      const sender = senderById.get(row.sender_id);
      return {
        id: row.id,
        senderId: row.sender_id,
        senderName: sender?.full_name || sender?.email || 'Unknown',
        senderRole: sender?.role ?? 'member',
        content: row.content,
        createdAt: row.created_at,
      };
    });
  }

  async send(profile: Profile, content: string): Promise<ChatMessage> {
    const trimmed = content?.trim();
    if (!trimmed) throw new BadRequestException('Message cannot be empty.');
    if (trimmed.length > maxMessageLength) throw new BadRequestException('Message is too long.');

    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('chat_messages')
      .insert({ sender_id: profile.id, content: trimmed })
      .select('id, sender_id, content, created_at')
      .single();
    if (error) {
      this.logger.error(`send: ${error.message}`, error);
      throw new InternalServerErrorException('Unable to send this message.');
    }

    const { data: sender } = await client
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', profile.id)
      .maybeSingle();

    return {
      id: data.id,
      senderId: data.sender_id,
      senderName: sender?.full_name || sender?.email || 'You',
      senderRole: sender?.role ?? profile.role,
      content: data.content,
      createdAt: data.created_at,
    };
  }
}
