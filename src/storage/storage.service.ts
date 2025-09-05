import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { StorageProvider } from './storage.provider';
import * as path from 'path';
import { createWriteStream, promises as fs } from 'fs';
import { UPLOADS_URL } from 'src/constants';

@Injectable()
export class StorageService implements StorageProvider {
  private uploadPath = path.resolve(__dirname, '../../uploads');

  async uploadStream(file: Readable, filename: string): Promise<string> {
    await fs.mkdir(this.uploadPath, { recursive: true });

    const filePath = path.join(this.uploadPath, filename);
    const writeStream = createWriteStream(filePath);

    await new Promise<void>((resolve, reject) => {
      file.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return `${UPLOADS_URL}/${filename}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadPath, key);
    await fs.unlink(filePath).catch(() => null);
  }

  getUrl(key: string): string {
    return `${UPLOADS_URL}/${key}`;
  }
}
