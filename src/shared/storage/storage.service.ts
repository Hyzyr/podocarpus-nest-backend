import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { StorageProvider } from './storage.provider';
import * as path from 'path';
import { createWriteStream, promises as fs } from 'fs';
import { UPLOADS_URL } from 'src/common/constants';

export type UploadCategory = 'users' | 'events' | 'properties';
export type UploadSubcategory = 'profile' | 'documents' | 'banners' | 'images' | 'files';

@Injectable()
export class StorageService {
  private uploadPath = path.resolve(
    process.cwd(),
    UPLOADS_URL.replaceAll('/', ''),
  );

  /**
   * Upload a file stream to categorized folder structure.
   *
   * Folder structure:
   * uploads/
   *   users/
   *     profile/  (user profile images)
   *   events/
   *     banners/ (event banner images)
   *   properties/
   *     images/  (property images)
   *     files/   (property documents/files)
   *
   * @param file - Readable stream of the file
   * @param filename - Name of the file
   * @param category - Main category (users, events, properties)
   * @param subcategory - Subcategory (profile, banners, images, files)
   * @returns The file key (category/subcategory/filename)
   */
  async uploadStream(
    file: Readable,
    filename: string,
    category: UploadCategory,
    subcategory: UploadSubcategory,
  ): Promise<string> {
    const categoryPath = path.join(this.uploadPath, category, subcategory);
    await fs.mkdir(categoryPath, { recursive: true });

    const filePath = path.join(categoryPath, filename);
    const writeStream = createWriteStream(filePath);

    await new Promise<void>((resolve, reject) => {
      file.pipe(writeStream);

      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      file.on('error', (err) => reject(err));
    });

    return `${category}/${subcategory}/${filename}`;
  }

  /**
   * Delete a file by its key.
   * @param key - File key (category/subcategory/filename)
   */
  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadPath, key);
    await fs.unlink(filePath).catch(() => null);
  }

  /**
   * Get the public URL for a file by its key.
   * @param key - File key (category/subcategory/filename)
   */
  getUrl(key: string): string {
    return `${UPLOADS_URL}/${key}`;
  }

  // Legacy method for backward compatibility
  async uploadStreamLegacy(file: Readable, filename: string): Promise<string> {
    await fs.mkdir(this.uploadPath, { recursive: true });

    const filePath = path.join(this.uploadPath, filename);
    const writeStream = createWriteStream(filePath);

    await new Promise<void>((resolve, reject) => {
      file.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      file.on('error', (err) => reject(err));
    });

    return `${UPLOADS_URL}/${filename}`;
  }
}
