import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Spacious 2BR with Marina View' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  developer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitNo?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  unitTotalSize?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  apartmentSize?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  balconySize?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  serviceChargePerSqft?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  serviceChargeTotal?: number;

  @ApiPropertyOptional({ type: Number, description: 'e.g. 2025' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rateYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  rentValue?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  contractValue?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  depositReceived?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  rentStart?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  rentExpiry?: Date;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    required: false,
    description: 'Defaults to true if handled in DB',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
