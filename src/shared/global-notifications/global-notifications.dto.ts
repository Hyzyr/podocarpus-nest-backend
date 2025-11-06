import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { NotificationType, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

// Param validation DTOs
export class GlobalNotificationIdParamDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  id: string;
}

// Query validation DTOs
export class GetAllNotificationsQueryDto {
  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class GlobalNotificationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'System Maintenance' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'The system will be under maintenance on October 30, 2-4 PM UTC',
  })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.system })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    example: [UserRole.investor, UserRole.broker],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiPropertyOptional({
    example: '/dashboard',
    description: 'Optional deep link',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({
    example: 'high',
    description: 'Notification priority: low, normal, high, critical',
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({
    example: '⚠️',
    description: 'Emoji or icon identifier',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: { maintenanceWindow: '2-4 PM UTC', affectedServices: ['API'] },
  })
  @IsOptional()
  json?: Record<string, any>;

  @ApiPropertyOptional({
    example: '2025-10-29T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({
    example: '2025-10-30T20:00:00Z',
    description: 'When the notification expires and is hidden',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2025-10-29T10:30:00Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2025-10-29T10:30:00Z' })
  updatedAt?: string;
}

// Response DTO with user-specific view status
export class GlobalNotificationWithStatusDto extends GlobalNotificationDto {
  @ApiProperty({ 
    example: true,
    description: 'Whether the current user has viewed this notification',
  })
  viewed: boolean;

  @ApiProperty({ 
    example: false,
    description: 'Whether the current user has dismissed this notification',
  })
  dismissed: boolean;
}

export class CreateGlobalNotificationDto {
  @ApiProperty({ example: 'System Maintenance' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'The system will be under maintenance on October 30, 2-4 PM UTC',
  })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.system })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    example: [UserRole.investor, UserRole.broker],
    description:
      'Empty array = visible to all roles; specify roles to limit visibility',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiPropertyOptional({ example: '/dashboard' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ example: 'high' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '⚠️' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    example: { maintenanceWindow: '2-4 PM UTC' },
  })
  @IsOptional()
  json?: Record<string, any>;

  @ApiPropertyOptional({ example: '2025-10-29T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2025-10-30T20:00:00Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateGlobalNotificationDto {
  @ApiPropertyOptional({ example: 'System Maintenance - Extended' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Extended maintenance window',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    isArray: true,
    enum: UserRole,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  targetRoles?: UserRole[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  json?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GlobalNotificationViewDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  globalNotificationId: string;

  @ApiProperty({ example: '2025-10-29T10:30:00Z' })
  viewedAt: string;

  @ApiProperty({ example: false })
  dismissed: boolean;
}

export class GlobalNotificationStatsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  notificationId: string;

  @ApiProperty({ example: 'System Maintenance' })
  title: string;

  @ApiProperty({ example: 5000 })
  targetedUsers: number;

  @ApiProperty({ example: 3200 })
  viewedCount: number;

  @ApiProperty({ example: 64 })
  viewPercentage: number;

  @ApiProperty({ example: 450 })
  dismissedCount: number;

  @ApiProperty({ example: '2025-10-29T10:30:00Z' })
  createdAt: string;
}

export class GetGlobalNotificationsResponseDto {
  @ApiProperty({ 
    type: [GlobalNotificationWithStatusDto],
    description: 'List of global notifications with view/dismiss status for current user',
  })
  notifications: GlobalNotificationWithStatusDto[];

  @ApiProperty({ 
    example: 12,
    description: 'Total number of active notifications',
  })
  total: number;

  @ApiProperty({ 
    example: 8,
    description: 'Number of notifications not yet viewed by current user',
  })
  unviewedCount: number;
}

// Success response DTO
export class NotificationActionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification marked as viewed' })
  message: string;
}

// Admin: Get all notifications response
export class GlobalNotificationWithViewCountDto extends GlobalNotificationDto {
  @ApiProperty({ example: 150, description: 'Total number of views' })
  viewCount: number;
}

export class GetAllNotificationsResponseDto {
  @ApiProperty({ 
    type: [GlobalNotificationWithViewCountDto],
    description: 'List of all global notifications with view counts',
  })
  notifications: GlobalNotificationWithViewCountDto[];

  @ApiProperty({ 
    example: 25,
    description: 'Total count of all notifications',
  })
  total: number;
}

// Analytics response DTOs
export class ViewsByRoleDto {
  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 12 })
  dismissed: number;
}

export class RecentViewDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  globalNotificationId: string;

  @ApiProperty({ example: '2025-10-29T10:30:00Z' })
  viewedAt: Date;

  @ApiProperty({ example: false })
  dismissed: boolean;

  @ApiProperty()
  user: {
    id: string;
    role: string;
    email: string;
  };
}

export class GetAnalyticsResponseDto {
  @ApiProperty({ example: 234, description: 'Total number of views' })
  totalViews: number;

  @ApiProperty({ example: 45, description: 'Total number of dismissed views' })
  totalDismissed: number;

  @ApiProperty({ 
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      admin: { total: 45, dismissed: 12 },
      investor: { total: 120, dismissed: 23 },
    },
    description: 'Views grouped by user role',
  })
  viewsByRole: Record<string, ViewsByRoleDto>;

  @ApiProperty({ 
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { '9': 23, '10': 45, '11': 32 },
    description: 'Views grouped by hour of day (0-23)',
  })
  viewsByHour: Record<number, number>;

  @ApiProperty({ 
    type: [RecentViewDto],
    description: 'Most recent 10 views',
  })
  recentViews: RecentViewDto[];
}
