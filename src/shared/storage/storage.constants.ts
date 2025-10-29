import { UploadCategory, UploadSubcategory } from './storage.service';

/**
 * Valid upload category-subcategory combinations
 */
export const VALID_UPLOAD_COMBINATIONS: Record<UploadCategory, UploadSubcategory[]> = {
  users: ['profile'],
  events: ['banners'],
  properties: ['images', 'files'],
} as const;

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  images: 5 * 1024 * 1024, // 5MB for images
  files: 50 * 1024 * 1024, // 50MB for documents
  banners: 10 * 1024 * 1024, // 10MB for event banners
  profile: 2 * 1024 * 1024, // 2MB for profile images
} as const;

/**
 * Allowed MIME types by subcategory
 */
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  files: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  banners: ['image/jpeg', 'image/png', 'image/webp'],
  profile: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  UPLOAD_PATH: 'uploads',
  MAX_FILES_PER_REQUEST: 1,
  FILENAME_MAX_LENGTH: 255,
} as const;