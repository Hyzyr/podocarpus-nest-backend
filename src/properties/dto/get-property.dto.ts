import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
export class FindAllPropertiesQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search across title/description/etc.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  developer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingName?: string;

  @ApiPropertyOptional({ type: Number, description: 'Min rent value' })
  @IsOptional()
  @Type(() => Number)
  minRent?: number;

  @ApiPropertyOptional({ type: Number, description: 'Max rent value' })
  @IsOptional()
  @Type(() => Number)
  maxRent?: number;

  @ApiPropertyOptional({ type: Number, description: 'Min unit total size' })
  @IsOptional()
  @Type(() => Number)
  minSize?: number;

  @ApiPropertyOptional({ type: Number, description: 'Max unit total size' })
  @IsOptional()
  @Type(() => Number)
  maxSize?: number;

  @ApiPropertyOptional({ description: 'True/false' })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: keyof PropertyDto | string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Filter createdAt from',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Filter createdAt to',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: Date;
}
export class PropertyIdParamDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  id: string;
}
