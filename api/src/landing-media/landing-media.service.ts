import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';
import { verifiedMimeType } from '../file-signature';

const bucket = 'landing-media';
const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Injectable()
export class LandingMediaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async upload(profile: { id: string }, file?: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('An image file is required.');
    const mimeType = verifiedMimeType(file, allowedMimeTypes);
    if (!mimeType) {
      throw new BadRequestException('Only PNG, JPG, or WEBP images are accepted.');
    }
    if (file.size > maxFileSizeBytes) throw new BadRequestException('The image must be 10 MB or smaller.');

    const client = this.supabase.getAdminClient();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `${Date.now()}-${safeName}`;

    const { error } = await client.storage.from(bucket).upload(fileKey, file.buffer, { contentType: mimeType });
    if (error) throw new InternalServerErrorException('Unable to upload the image.');

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing_media.uploaded',
      entityType: 'landing_media',
      newData: { fileKey, fileName: file.originalname, mimeType, size: file.size },
    });

    const { data } = client.storage.from(bucket).getPublicUrl(fileKey);
    return { url: data.publicUrl };
  }
}
