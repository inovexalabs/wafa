import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

const bucket = 'landing-media';
const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Injectable()
export class LandingMediaService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(file?: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('An image file is required.');
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Only PNG, JPG, or WEBP images are accepted.');
    }
    if (file.size > maxFileSizeBytes) throw new BadRequestException('The image must be 10 MB or smaller.');

    const client = this.supabase.getAdminClient();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `${Date.now()}-${safeName}`;

    const { error } = await client.storage.from(bucket).upload(fileKey, file.buffer, { contentType: file.mimetype });
    if (error) throw new InternalServerErrorException(`Unable to upload the image: ${error.message}`);

    const { data } = client.storage.from(bucket).getPublicUrl(fileKey);
    return { url: data.publicUrl };
  }
}
