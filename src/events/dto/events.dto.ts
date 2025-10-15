import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { UserEventStatusDto } from './event.status.dto';

export class EventIdParamDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  id: string;
}

export class CreateEventDto {
  @ApiProperty({
    example: 'AI Arab Night Lunch with VIP members',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 2000,
    example:
      'Podocarpus offers carefully selected properties built for lasting growth and proven returns.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-06-30T19:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startsAt: string | Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-06-30T23:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: string | Date | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    example: 'Jumeirah Lakes Towers (JLT), Dubai DMCC Freezone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 10000,
    description: 'Total members or capacity',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalMembers?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 17500,
    description: 'Budget in numeric value',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0) // use @IsPositive() if you want > 0 only
  budget?: number | null;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.OPEN })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({
    type: String,
    description: 'Image URL',
  })
  @IsString()
  image: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class EventDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'AI Arab Night Lunch with VIP members' })
  title: string;

  @ApiProperty({
    example:
      'Podocarpus offers carefully selected properties built for lasting growth and proven returns.',
  })
  description?: string | null;

  @ApiProperty({ example: '2025-06-30T19:00:00.000Z' })
  startsAt: Date;

  @ApiProperty({ example: '2025-06-30T23:00:00.000Z' })
  endsAt?: Date | null;

  @ApiProperty({ example: 'Jumeirah Lakes Towers (JLT), Dubai DMCC Freezone' })
  location?: string | null;

  @ApiProperty({ example: 10000 })
  totalMembers?: number | null;

  @ApiProperty({ example: 17500 })
  budget?: number | null;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty({
    type: String,
    description: 'Image URL',
  })
  @IsString()
  image: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-05-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-08T12:00:00.000Z' })
  updatedAt: Date;
}

export class EventWithStatusDto extends EventDto {
  @ApiProperty({
    type: [UserEventStatusDto],
    description: 'Statuses of users related to this event',
  })
  userStatuses: UserEventStatusDto[];
}
