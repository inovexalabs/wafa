import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };

const bucket = 'landing-documents';
const maxFileSizeBytes = 25 * 1024 * 1024;
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

export interface PublicDocument {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPublished: boolean;
}

export interface SaveDocumentMetaInput {
  title?: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

@Injectable()
export class PublicDocumentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listPublished(): Promise<PublicDocument[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('public_documents')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load documents.');
    return (data ?? []).map((row) => this.map(row));
  }

  async listAll(): Promise<PublicDocument[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('public_documents')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new InternalServerErrorException('Unable to load documents.');
    return (data ?? []).map((row) => this.map(row));
  }

  async upload(
    profile: Profile,
    meta: SaveDocumentMetaInput,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('A document file is required.');
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, Word, Excel, PNG, or JPG files are accepted.');
    }
    if (file.size > maxFileSizeBytes) throw new BadRequestException('The file must be 25 MB or smaller.');
    if (!meta?.title?.trim()) throw new BadRequestException('Title is required.');

    const client = this.supabase.getAdminClient();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(fileKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      throw new InternalServerErrorException(`Unable to upload the document: ${uploadError.message}`);
    }

    const { data, error } = await client
      .from('public_documents')
      .insert({
        title: meta.title.trim(),
        description: meta.description?.trim() || null,
        file_key: fileKey,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        sort_order: meta.sortOrder ?? 0,
        is_published: meta.isPublished ?? true,
        uploaded_by: profile.id,
      })
      .select('*')
      .single();

    if (error) {
      await client.storage.from(bucket).remove([fileKey]);
      throw new BadRequestException(error.message);
    }

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'public_documents.created',
      entityType: 'public_documents',
      entityId: data.id,
      newData: { title: meta.title },
    });

    return this.map(data);
  }

  async update(profile: Profile, id: string, input: Partial<SaveDocumentMetaInput>) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) {
      if (!input.title.trim()) throw new BadRequestException('Title is required.');
      patch.title = input.title.trim();
    }
    if (input.description !== undefined) patch.description = input.description?.trim() || null;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('public_documents')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Record not found.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'public_documents.updated',
      entityType: 'public_documents',
      entityId: id,
      newData: patch,
    });

    return this.map(data);
  }

  async remove(profile: Profile, id: string) {
    const client = this.supabase.getAdminClient();
    const { data: existing, error: fetchError } = await client
      .from('public_documents')
      .select('file_key')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new InternalServerErrorException('Unable to load the document.');
    if (!existing) throw new NotFoundException('Record not found.');

    const { error } = await client.from('public_documents').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);

    await client.storage.from(bucket).remove([existing.file_key]);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'public_documents.deleted',
      entityType: 'public_documents',
      entityId: id,
    });

    return { success: true };
  }

  private map(row: {
    id: string;
    title: string;
    description: string | null;
    file_key: string;
    original_filename: string;
    mime_type: string;
    file_size: number;
    sort_order: number;
    is_published: boolean;
  }): PublicDocument {
    const { data } = this.supabase.getAdminClient().storage.from(bucket).getPublicUrl(row.file_key);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      fileUrl: data.publicUrl,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    };
  }
}
