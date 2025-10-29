import { Controller, Post, Req, Query, BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { StorageService, UploadCategory, UploadSubcategory } from './storage.service';
import { VALID_UPLOAD_COMBINATIONS } from './storage.constants';
import { safeFilename } from 'src/utils/file-rename';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  async uploadFile(
    @Req() req: FastifyRequest,
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
  ) {
    // Validate required parameters
    if (!category || !subcategory) {
      throw new BadRequestException('category and subcategory query parameters are required');
    }

    // Validate category
    if (!(category in VALID_UPLOAD_COMBINATIONS)) {
      throw new BadRequestException(`Invalid category: ${category}. Must be one of: ${Object.keys(VALID_UPLOAD_COMBINATIONS).join(', ')}`);
    }

    // Validate subcategory for the given category
    const validCategory = category as UploadCategory;
    const validSubcategories = VALID_UPLOAD_COMBINATIONS[validCategory];
    if (!validSubcategories.includes(subcategory as UploadSubcategory)) {
      throw new BadRequestException(`Invalid subcategory: ${subcategory} for category ${category}. Valid options: ${validSubcategories.join(', ')}`);
    }

    const parts = req.parts(); // async iterator
    for await (const part of parts) {
      if (part.type === 'file') {
        const key = await this.storageService.uploadStream(
          part.file, // Readable stream
          safeFilename(part.filename),
          validCategory,
          subcategory as UploadSubcategory,
        );
        const url = this.storageService.getUrl(key);
        return { url, key };
      }
    }
    return { error: 'No file found' };
  }
}
