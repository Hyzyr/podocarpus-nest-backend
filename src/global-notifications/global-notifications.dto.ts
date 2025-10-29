import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { NotificationType, UserRole } from '@prisma/client';

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
  @ApiProperty({ type: [GlobalNotificationDto] })
  notifications: GlobalNotificationDto[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 8 })
  unviewedCount: number;
}
