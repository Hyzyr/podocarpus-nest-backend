import path from 'path';
import crypto from 'crypto';

export function safeFilename(original: string): string {
  const ext = path.extname(original); // ".jpg"
  const base = path.basename(original, ext); // "My File (Final)"

  // Normalize: lowercase, trim, replace spaces with dash, strip unsafe chars
  let safeBase = base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces -> dashes
    .replace(/[^a-z0-9-_]/g, ''); // remove unsafe chars

  if (!safeBase) {
    safeBase = 'file';
  }

  // Timestamp (YYYYMMDD-HHMMSS)
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, '') // remove - and :
    .replace(/\..+/, ''); // drop milliseconds → "20230905T142530"

  // Random hex to reduce collision risk
  const unique = crypto.randomBytes(4).toString('hex');

  return `${safeBase}-${timestamp}-${unique}${ext.toLowerCase()}`;
}
