import { Controller, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { StorageService } from './storage.service';
import { safeFilename } from 'src/utils/file-rename';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  async uploadFile(@Req() req: FastifyRequest) {
    const parts = req.parts(); // async iterator
    for await (const part of parts) {
      if (part.type === 'file') {
        const url = await this.storageService.uploadStream(
          part.file, // Readable stream
          safeFilename(part.filename),
        );
        return { url };
      }
    }
    return { error: 'No file found' };
  }
}
