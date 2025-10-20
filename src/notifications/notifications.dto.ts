import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-of-user', description: 'Target user ID' })
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

  @ApiProperty({ example: 'Your contract #CN-2025-01 has been approved.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: '/contracts/123',
    description: 'Optional link to related page',
  })
  @IsOptional()
  @IsString()
  link?: string;
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
    description: 'When user read it',
  })
  @IsOptional()
  @IsDateString()
  readAt?: string;
}
