import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class EventIdParamDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  id: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'AI Arab Night Lunch with VIP members' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Podocarpus offers carefully selected properties built for lasting growth and proven returns.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: '2025-06-30T19:00:00.000Z', description: 'ISO 8601 date string' })
  @IsNotEmpty()
  @IsDateString()
  startsAt: Date;

  @ApiPropertyOptional({ example: '2025-06-30T23:00:00.000Z', description: 'ISO 8601 date string' })
  @IsOptional()
  @IsDateString()
  endsAt?: Date | null;

  @ApiPropertyOptional({ example: 'Jumeirah Lakes Towers (JLT), Dubai DMCC Freezone' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string | null;

  @ApiPropertyOptional({ example: 10000, description: 'Total members or capacity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalMembers?: number | null;

  @ApiPropertyOptional({ example: 17500, description: 'Budget in numeric value' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  budget?: number | null;

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

  @ApiProperty({ example: 'Podocarpus offers carefully selected properties built for lasting growth and proven returns.' })
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

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-05-08T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-08T12:00:00.000Z' })
  updatedAt: Date;
}