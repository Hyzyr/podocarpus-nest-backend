import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserActionsStatus } from '@prisma/client';
import { IsDate, IsEnum, IsString } from 'class-validator';

export class CreateEventStatusDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 'user-123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ID of the related event',
    example: 'event-456',
  })
  @IsString()
  eventId: string;

  @ApiProperty({
    description: 'When the user viewed this event',
    example: '2025-09-14T08:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  viewedAt: Date;

  @ApiProperty({
    description: 'Status of the user with respect to the event',
    enum: UserActionsStatus,
    example: UserActionsStatus.seen,
  })
  @IsEnum(UserActionsStatus)
  status: UserActionsStatus;
}
export class UserEventStatusDto extends CreateEventStatusDto {
  @ApiProperty({
    description: 'Unique identifier of the user-event status',
    example: '550e8400-e29b...',
  })
  @IsString()
  id: string;
}
export class UpdateUserEventStatusDto extends PartialType(
  CreateEventStatusDto,
) {}
