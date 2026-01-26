import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { FileAttachmentDto } from '../../common/dto/file-attachment.dto';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  contractValue?: number;

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
    description: 'Indicates if the property is currently vacant',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;

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

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  assets: string[];

  @ApiPropertyOptional({ type: [FileAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  documents?: FileAttachmentDto[];

  @ApiProperty({
    required: false,
    description: 'If false, the property will be hidden/disabled without deleting it',
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
