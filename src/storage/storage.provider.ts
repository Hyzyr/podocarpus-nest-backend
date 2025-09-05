import { Readable } from 'stream';

export interface StorageProvider {
  uploadStream(file: Readable, filename: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
