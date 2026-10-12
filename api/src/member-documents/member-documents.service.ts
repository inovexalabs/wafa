import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { fetchAllRows } from '../supabase-paging';

type Profile = { id: string; role: string };

/** Whose documents: a member (by members.id) or a staff user (by profiles.id). */
export type DocumentOwner =
  { kind: 'member'; memberId: string } | { kind: 'staff'; profileId: string };

/** Who uploads a document type: everyone, members only, or staff only. */
export type DocumentAudience = 'everyone' | 'members' | 'staff';

export interface MemberDocumentType {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  sortOrder: number;
  appliesTo: DocumentAudience;
  uploadCount?: number;
}

export interface SaveDocumentTypeInput {
  name: string;
  description?: string;
  isRequired?: boolean;
  sortOrder?: number;
  appliesTo?: DocumentAudience;
}

export interface StaffDirectoryEntry {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  joinedAt: string;
  documentsUploaded: number;
  documentsTotal: number;
  missingRequired: string[];
}

export interface MemberDocument {
  id: string;
  documentNumber: string | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface MemberDocumentSlot {
  type: MemberDocumentType;
  document: MemberDocument | null;
}

type TypeRow = {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  applies_to: DocumentAudience;
};

type StaffRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
};

type DocumentRow = {
  id: string;
  document_type_id: string;
  document_number: string | null;
  file_key: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  updated_at: string;
};

const bucket = 'member-documents';
const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);
export const maxMemberDocumentBytes = 10 * 1024 * 1024;
const signedUrlTtlSeconds = 60 * 10;
const audiences = new Set<DocumentAudience>(['everyone', 'members', 'staff']);
const staffRoles = ['superadmin', 'admin', 'accountant'];
const typeColumns =
  'id, name, description, is_required, sort_order, applies_to';
const documentColumns =
  'id, document_type_id, document_number, file_key, original_filename, mime_type, file_size, updated_at';

@Injectable()
export class MemberDocumentsService {
  private readonly logger = new Logger(MemberDocumentsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  // ---------- Document types (superadmin) ----------

  async listTypes(): Promise<MemberDocumentType[]> {
    const client = this.supabase.getAdminClient();
    const [{ data: types, error }, { data: uploads, error: uploadsError }] =
      await Promise.all([
        client
          .from('member_document_types')
          .select(typeColumns)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        fetchAllRows<{ document_type_id: string }>((from, to) =>
          client
            .from('member_documents')
            .select('document_type_id')
            .order('id')
            .range(from, to),
        ),
      ]);
    if (error || uploadsError)
      throw new InternalServerErrorException('Unable to load document types.');

    const counts = new Map<string, number>();
    for (const row of uploads ?? [])
      counts.set(
        row.document_type_id,
        (counts.get(row.document_type_id) ?? 0) + 1,
      );
    return (types ?? []).map((row) => ({
      ...this.mapType(row),
      uploadCount: counts.get(row.id) ?? 0,
    }));
  }

  async createType(profile: Profile, input: SaveDocumentTypeInput) {
    const name = this.cleanTypeName(input?.name);
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('member_document_types')
      .insert({
        name,
        description: input.description?.trim() || null,
        is_required: input.isRequired ?? false,
        sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
        applies_to: this.cleanAudience(input.appliesTo ?? 'everyone'),
      })
      .select(typeColumns)
      .single();
    if (error) throw this.typeWriteError(error);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'member_document_type.created',
      entityType: 'member_document_type',
      entityId: data.id,
      newData: {
        name,
        isRequired: data.is_required,
        appliesTo: data.applies_to,
      },
    });

    return { ...this.mapType(data), uploadCount: 0 };
  }

  async updateType(
    profile: Profile,
    id: string,
    input: Partial<SaveDocumentTypeInput>,
  ) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = this.cleanTypeName(input.name);
    if (input.description !== undefined)
      patch.description = input.description?.trim() || null;
    if (input.isRequired !== undefined) patch.is_required = !!input.isRequired;
    if (input.sortOrder !== undefined) {
      if (!Number.isFinite(input.sortOrder))
        throw new BadRequestException('Sort order must be a number.');
      patch.sort_order = input.sortOrder;
    }
    if (input.appliesTo !== undefined)
      patch.applies_to = this.cleanAudience(input.appliesTo);
    if (!Object.keys(patch).length)
      throw new BadRequestException('Nothing to update.');

    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('member_document_types')
      .update(patch)
      .eq('id', id)
      .select(typeColumns)
      .maybeSingle();
    if (error) throw this.typeWriteError(error);
    if (!data) throw new NotFoundException('Document type not found.');

    const { count } = await client
      .from('member_documents')
      .select('id', { count: 'exact', head: true })
      .eq('document_type_id', id);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'member_document_type.updated',
      entityType: 'member_document_type',
      entityId: id,
      newData: patch,
    });

    return { ...this.mapType(data), uploadCount: count ?? 0 };
  }

  // Deleting a type also deletes every member's upload of that type (rows cascade
  // in the database; the stored files are removed here).
  async removeType(profile: Profile, id: string) {
    const client = this.supabase.getAdminClient();
    const { data: type, error: typeError } = await client
      .from('member_document_types')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
    if (typeError)
      throw new InternalServerErrorException(
        'Unable to load this document type.',
      );
    if (!type) throw new NotFoundException('Document type not found.');

    const { data: uploads, error: uploadsError } = await client
      .from('member_documents')
      .select('file_key')
      .eq('document_type_id', id);
    if (uploadsError)
      throw new InternalServerErrorException(
        'Unable to load uploads for this document type.',
      );

    const { error } = await client
      .from('member_document_types')
      .delete()
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);

    const fileKeys = (uploads ?? []).map((row) => row.file_key);
    if (fileKeys.length) await this.removeFiles(fileKeys);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'member_document_type.deleted',
      entityType: 'member_document_type',
      entityId: id,
      oldData: { name: type.name, uploadsRemoved: fileKeys.length },
    });

    return { success: true };
  }

  // ---------- Staff directory (superadmin) ----------

  // Every superadmin, admin and accountant with how complete their documents
  // are, mirroring the member directory.
  async staffDirectory(): Promise<StaffDirectoryEntry[]> {
    const client = this.supabase.getAdminClient();
    const [
      { data: staff, error: staffError },
      { data: types, error: typesError },
      { data: documents, error: documentsError },
    ] = await Promise.all([
      client
        .from('profiles')
        .select('id, user_id, full_name, email, phone, role, created_at')
        .in('role', staffRoles)
        .order('full_name', { ascending: true }),
      client
        .from('member_document_types')
        .select('id, name, is_required')
        .in('applies_to', ['everyone', 'staff']),
      client
        .from('member_documents')
        .select('profile_id, document_type_id')
        .not('profile_id', 'is', null),
    ]);
    if (staffError || typesError || documentsError)
      throw new InternalServerErrorException('Unable to load staff.');

    const uploadedByProfile = new Map<string, Set<string>>();
    for (const row of documents ?? []) {
      const uploaded = uploadedByProfile.get(row.profile_id) ?? new Set();
      uploaded.add(row.document_type_id);
      uploadedByProfile.set(row.profile_id, uploaded);
    }
    const allTypes = types ?? [];
    const requiredTypes = allTypes.filter((type) => type.is_required);

    return ((staff ?? []) as StaffRow[]).map((profile) => {
      const uploaded = uploadedByProfile.get(profile.id) ?? new Set<string>();
      return {
        id: profile.id,
        userId: profile.user_id,
        fullName: profile.full_name || profile.user_id,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        joinedAt: profile.created_at,
        documentsUploaded: allTypes.filter((type) => uploaded.has(type.id))
          .length,
        documentsTotal: allTypes.length,
        missingRequired: requiredTypes
          .filter((type) => !uploaded.has(type.id))
          .map((type) => type.name),
      };
    });
  }

  // ---------- Member documents ----------

  async memberIdFor(profile: Profile) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('members')
      .select('id')
      .eq('auth_user_id', profile.id)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to resolve your member record.',
      );
    if (!data) throw new NotFoundException('Member record not found.');
    return data.id as string;
  }

  async listFor(owner: DocumentOwner): Promise<MemberDocumentSlot[]> {
    await this.assertOwnerExists(owner);
    const [ownerColumn, ownerId] = this.ownerKey(owner);
    const client = this.supabase.getAdminClient();
    const [{ data: types, error }, { data: documents, error: documentsError }] =
      await Promise.all([
        client
          .from('member_document_types')
          .select(typeColumns)
          .in('applies_to', this.audiencesFor(owner))
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        client
          .from('member_documents')
          .select(documentColumns)
          .eq(ownerColumn, ownerId),
      ]);
    if (error || documentsError)
      throw new InternalServerErrorException('Unable to load documents.');

    const byType = new Map(
      (documents ?? []).map((row) => [row.document_type_id, row]),
    );
    return (types ?? []).map((row) => {
      const document = byType.get(row.id);
      return {
        type: this.mapType(row),
        document: document ? this.mapDocument(document) : null,
      };
    });
  }

  async upload(
    actor: Profile,
    owner: DocumentOwner,
    typeId: string,
    input: { documentNumber?: string },
    file?: Express.Multer.File,
  ): Promise<MemberDocumentSlot> {
    if (!file) throw new BadRequestException('A document file is required.');
    if (!allowedMimeTypes.has(file.mimetype))
      throw new BadRequestException(
        'Only PNG, JPG, WEBP, or PDF files are accepted.',
      );
    if (file.size > maxMemberDocumentBytes)
      throw new BadRequestException('The file must be 10 MB or smaller.');
    const documentNumber = input?.documentNumber?.trim() || null;
    if (documentNumber && documentNumber.length > 100)
      throw new BadRequestException(
        'Document number must be 100 characters or fewer.',
      );

    await this.assertOwnerExists(owner);
    const [ownerColumn, ownerId] = this.ownerKey(owner);
    const client = this.supabase.getAdminClient();
    const { data: type, error: typeError } = await client
      .from('member_document_types')
      .select(typeColumns)
      .eq('id', typeId)
      .maybeSingle();
    if (typeError)
      throw new InternalServerErrorException(
        'Unable to load this document type.',
      );
    if (!type) throw new NotFoundException('Document type not found.');
    if (!this.audiencesFor(owner).includes(type.applies_to))
      throw new BadRequestException(
        `${type.name} is only uploaded by ${type.applies_to}.`,
      );

    const { data: existing } = await client
      .from('member_documents')
      .select('file_key')
      .eq(ownerColumn, ownerId)
      .eq('document_type_id', typeId)
      .maybeSingle();

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    // Member files keep their original `<memberId>/` prefix; staff files live under `staff/`.
    const folder = owner.kind === 'member' ? ownerId : `staff/${ownerId}`;
    const fileKey = `${folder}/${typeId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(fileKey, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      this.logger.error(`upload: ${uploadError.message}`, uploadError);
      throw new InternalServerErrorException('Unable to upload this document.');
    }

    const { data, error } = await client
      .from('member_documents')
      .upsert(
        {
          [ownerColumn]: ownerId,
          document_type_id: typeId,
          document_number: documentNumber,
          file_key: fileKey,
          original_filename: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: actor.id,
        },
        { onConflict: `${ownerColumn},document_type_id` },
      )
      .select(documentColumns)
      .single();
    if (error) {
      await this.removeFiles([fileKey]);
      throw new BadRequestException(error.message);
    }
    if (existing?.file_key) await this.removeFiles([existing.file_key]);

    await this.audit.log({
      actor: { userId: actor.id },
      action: existing
        ? 'member_document.replaced'
        : 'member_document.uploaded',
      entityType: 'member_document',
      entityId: data.id,
      newData: {
        ...this.ownerAuditFields(owner),
        documentType: type.name,
        fileName: file.originalname,
      },
    });

    return { type: this.mapType(type), document: this.mapDocument(data) };
  }

  async remove(actor: Profile, owner: DocumentOwner, typeId: string) {
    const [ownerColumn, ownerId] = this.ownerKey(owner);
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('member_documents')
      .delete()
      .eq(ownerColumn, ownerId)
      .eq('document_type_id', typeId)
      .select('id, file_key, original_filename')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Document not found.');
    await this.removeFiles([data.file_key]);

    await this.audit.log({
      actor: { userId: actor.id },
      action: 'member_document.deleted',
      entityType: 'member_document',
      entityId: data.id,
      oldData: {
        ...this.ownerAuditFields(owner),
        documentTypeId: typeId,
        fileName: data.original_filename,
      },
    });

    return { success: true };
  }

  async fileUrl(owner: DocumentOwner, typeId: string) {
    const [ownerColumn, ownerId] = this.ownerKey(owner);
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('member_documents')
      .select('file_key, original_filename')
      .eq(ownerColumn, ownerId)
      .eq('document_type_id', typeId)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load this document.');
    if (!data) throw new NotFoundException('Document not found.');

    const { data: signed, error: signError } = await client.storage
      .from(bucket)
      .createSignedUrl(data.file_key, signedUrlTtlSeconds);
    if (signError || !signed?.signedUrl)
      throw new InternalServerErrorException(
        'Unable to generate a link for this file.',
      );
    return { fileUrl: signed.signedUrl, fileName: data.original_filename };
  }

  // ---------- Helpers ----------

  private ownerKey(owner: DocumentOwner): ['member_id' | 'profile_id', string] {
    return owner.kind === 'member'
      ? ['member_id', owner.memberId]
      : ['profile_id', owner.profileId];
  }

  private ownerAuditFields(owner: DocumentOwner) {
    return owner.kind === 'member'
      ? { memberId: owner.memberId }
      : { profileId: owner.profileId };
  }

  private audiencesFor(owner: DocumentOwner): DocumentAudience[] {
    return ['everyone', owner.kind === 'member' ? 'members' : 'staff'];
  }

  private async assertOwnerExists(owner: DocumentOwner) {
    const client = this.supabase.getAdminClient();
    if (owner.kind === 'staff') {
      const { data, error } = await client
        .from('profiles')
        .select('id')
        .eq('id', owner.profileId)
        .in('role', staffRoles)
        .maybeSingle();
      if (error)
        throw new InternalServerErrorException('Unable to load this user.');
      if (!data) throw new NotFoundException('Staff user not found.');
      return;
    }
    const { data, error } = await client
      .from('members')
      .select('id')
      .eq('id', owner.memberId)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException('Unable to load this member.');
    if (!data) throw new NotFoundException('Member not found.');
  }

  private cleanAudience(value: string): DocumentAudience {
    if (!audiences.has(value as DocumentAudience))
      throw new BadRequestException(
        'Applies to must be everyone, members, or staff.',
      );
    return value as DocumentAudience;
  }

  private async removeFiles(fileKeys: string[]) {
    const { error } = await this.supabase
      .getAdminClient()
      .storage.from(bucket)
      .remove(fileKeys);
    // A leftover object only costs storage; never fail the request over it.
    if (error) this.logger.warn(`removeFiles: ${error.message}`);
  }

  private cleanTypeName(value?: string) {
    const name = value?.trim();
    if (!name) throw new BadRequestException('Name is required.');
    if (name.length > 100)
      throw new BadRequestException('Name must be 100 characters or fewer.');
    return name;
  }

  private typeWriteError(error: { code?: string; message: string }) {
    return new BadRequestException(
      error.code === '23505'
        ? 'A document type with this name already exists.'
        : error.message,
    );
  }

  private mapType(row: TypeRow): MemberDocumentType {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isRequired: row.is_required,
      sortOrder: row.sort_order,
      appliesTo: row.applies_to,
    };
  }

  private mapDocument(row: DocumentRow): MemberDocument {
    return {
      id: row.id,
      documentNumber: row.document_number,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      fileSize: Number(row.file_size),
      uploadedAt: row.updated_at,
    };
  }
}
