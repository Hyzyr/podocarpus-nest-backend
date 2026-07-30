import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { NotificationType, NotificationStatus, UserRole } from '@prisma/client';

// Param validation DTOs
export class NotificationIdParamDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  id: string;
}

export class NotificationDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({
    example: 'uuid-of-user',
    description: 'Target user ID (null if global)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.contract })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: 'Contract Approved',
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Your contract #CN-2025-01 has been approved.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: '/contracts/123',
    description: 'Optional deep link to related page',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({
    example: { contractId: '123', amount: 5000 },
    description: 'Optional structured data (stored in json column)',
  })
  @IsOptional()
  json?: Record<string, any>;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    example: NotificationStatus.read,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
/**
 * Body for the admin "create a notification" endpoint.
 *
 * Deliberately has no targetRoles/isGlobal: role-targeted announcements are a
 * different model now and are created through /global-notifications. Leaving
 * those fields here let callers set them on a user-specific row, where they do
 * nothing — several call sites had done exactly that.
 */
export class CreateNotificationDto {
  @ApiProperty({
    example: 'uuid-of-user',
    description: 'The user who receives this notification',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.contract })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: 'Contract Approved',
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Your contract #CN-2025-01 has been approved.',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: '/contracts/123',
    description: 'Optional deep link to related page',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({
    example: { contractId: '123', amount: 5000 },
    description: 'Optional structured data (stored in json column)',
  })
  @IsOptional()
  json?: Record<string, any>;
}
export class UpdateNotificationDto {
  @ApiPropertyOptional({
    enum: NotificationStatus,
    example: NotificationStatus.read,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    example: new Date().toISOString(),
    description: 'When the user read it',
  })
  @IsOptional()
  @IsDateString()
  readAt?: string;

  @ApiPropertyOptional({
    example: { extra: 'updated info' },
    description: 'Optional updated JSON payload',
  })
  @IsOptional()
  json?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Updated message text',
  })
  @IsOptional()
  @IsString()
  message?: string;

}

//
// ────────────────────────────────────────────────
//   INTERNAL TYPES (for service usage)
// ────────────────────────────────────────────────
//
export interface NotificationDtoType {
  id: string;
  userId?: string;
  status: NotificationStatus;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  json?: Record<string, any>;
}

/** What the reader sees. Shared by every notify* helper. */
export interface NotifyContent {
  title: string;
  message: string;
  /** Deep link relative to the site root, e.g. "/contracts/123". */
  link?: string;
  json?: Record<string, any>;
}

export interface NotifyOptions extends NotifyContent {
  type: NotificationType;
  /**
   * Also deliver by email. Off by default — most notifications are in-app only
   * and emailing them all would be noise.
   */
  email?: boolean;
}

export interface NotifyRolesOptions extends NotifyOptions {
  /** "low" | "normal" | "high" | "critical". Defaults to normal. */
  priority?: string;
  icon?: string;
  /**
   * When this stops being shown. Defaults to BROADCAST_TTL_DAYS from now —
   * announcements that never expire accumulate indefinitely, and a months-old
   * "new property added" is not news. Pass null to keep it visible forever.
   */
  expiresAt?: Date | null;
  /**
   * Treat this as a work item rather than news. Any recipient can resolve it,
   * which clears it for everyone — use it when the thing only needs doing once
   * ("review this blocked account"), not for announcements where each person
   * keeps their own read state.
   */
  requiresAction?: boolean;
}

/** @deprecated Use NotifyContent. */
export type NotifyInputDto = NotifyContent;

// Response DTOs
export class MarkAsReadResponseDto {
  @ApiProperty({ 
    example: true,
    description: 'Whether the notification was successfully marked as read',
  })
  success: boolean;
}
