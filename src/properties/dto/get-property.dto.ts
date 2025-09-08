import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InvestorProfileDto } from 'src/users/dto';

export class PropertyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  developer?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitNo?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  unitTotalSize?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  apartmentSize?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  balconySize?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  serviceChargePerSqft?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  serviceChargeTotal?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'e.g. 2025',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rateYear?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  rentValue?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  contractValue?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  depositReceived?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  rentStart?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  rentExpiry?: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  latitude?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  longitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string | null;

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

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  // owner info
  @ApiPropertyOptional({ description: 'Owner userId if available' })
  ownerId?: string | null;

  @ApiPropertyOptional({ type: () => InvestorProfileDto, nullable: true })
  @Type(() => InvestorProfileDto)
  owner?: InvestorProfileDto | null;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
