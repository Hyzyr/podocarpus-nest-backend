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
    enum: UserRole,
    isArray: true,
    example: [UserRole.investor, UserRole.broker],
    description:
      'Roles that should see this notification (used when isGlobal = true)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the notification is global (visible to roles)',
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

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
export class CreateNotificationDto {
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
    enum: UserRole,
    isArray: true,
    example: [UserRole.investor, UserRole.broker],
    description:
      'Roles that should see this notification (used when isGlobal = true)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the notification is global (visible to roles)',
  })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

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

  // @ApiPropertyOptional({
  //   example: false,
  //   description: 'Whether the notification is global (visible to roles)',
  // })
  // @IsOptional()
  // @IsBoolean()
  // isGlobal?: boolean;
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
  targetRoles?: UserRole[];
  isGlobal?: boolean;
  json?: Record<string, any>;
}
export interface NotifyInputDto {
  title: string;
  message: string;
  link?: string;
  json?: Record<string, any>;
}
export interface CreateNotifyDto extends NotifyInputDto {
  userId?: string; // optional for global
  type: NotificationType;
  targetRoles?: UserRole[];
  isGlobal?: boolean;
}

// Response DTOs
export class MarkAsReadResponseDto {
  @ApiProperty({ 
    example: true,
    description: 'Whether the notification was successfully marked as read',
  })
  success: boolean;
}
