import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InvestorProfileDto } from 'src/users/dto';
import z from 'zod';

//  for public use only
export class PublicPropertyDto {
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
  contractValue?: number | null;

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

  @ApiProperty({
    example: 'Low',
    required: false,
    description: 'Vacancy risk level',
  })
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
export const PublicPropertySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    area: z.string().nullable().optional(),
    buildingName: z.string().nullable().optional(),
    contractValue: z.number(),
    developer: z.string().nullable().optional(),
    unitNo: z.string().nullable().optional(),
    floor: z.number().nullable().optional(),
    condition: z.string().nullable().optional(),
    unitTotalSize: z.number().nullable().optional(),
    apartmentSize: z.number().nullable().optional(),
    balconySize: z.number().nullable().optional(),
    status: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean(),
    netRoiMin: z.number().nullable().optional(),
    netRoiMax: z.number().nullable().optional(),
    isTaxFreeZone: z.boolean().nullable().optional(),
    keyBenefits: z.array(z.string()).optional(),
    freezoneAuthority: z.string().nullable().optional(),
    vacancyRisk: z.string().nullable().optional(),
  })
  .strip();

export type PublicProperty = z.infer<typeof PublicPropertySchema>;
