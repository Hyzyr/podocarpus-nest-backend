import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';

export class ContractIdParamDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  id: string;
}

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

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  rentStart?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  rentExpiry?: string;

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

  @ApiPropertyOptional({
    description: 'Minimum estimated Net ROI (%)',
    example: 9,
  })
  @IsOptional()
  @IsNumber()
  netRoiMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum estimated Net ROI (%)',
    example: 11,
  })
  @IsOptional()
  @IsNumber()
  netRoiMax?: number;

  @ApiPropertyOptional({
    description: 'Indicates if property is in a tax-free zone',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isTaxFreeZone?: boolean;

  @ApiPropertyOptional({
    description: 'Vacancy risk level (Low, Medium, High)',
    example: 'Low',
  })
  @IsOptional()
  @IsString()
  vacancyRisk?: string;

  @ApiPropertyOptional({
    description: 'Key benefits (e.g., 100% Ownership, Tax-Free, Repatriation)',
    example: [
      '100% Foreign Ownership',
      'Tax-Free Zone',
      'Full Capital Repatriation',
    ],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  keyBenefits?: string[];

  @ApiPropertyOptional({
    description: 'Freezone authority governing the property',
    example: 'DMCC Freezone',
  })
  @IsOptional()
  @IsString()
  freezoneAuthority?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    required: false,
    description: 'Defaults to true if handled in DB',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
