import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LandingQueryDto {
  @ApiPropertyOptional({ default: 4, maximum: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  propertiesLimit?: number = 4;

  @ApiPropertyOptional({ default: 4, maximum: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  eventsLimit?: number = 4;

  @ApiPropertyOptional({ default: 3, maximum: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  casesLimit?: number = 3;
}

export class LandingLimitQueryDto {
  @ApiPropertyOptional({ default: 4, maximum: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  limit?: number = 4;
}

export class LandingCasesLimitQueryDto {
  @ApiPropertyOptional({ default: 3, maximum: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  limit?: number = 3;
}

export class SuccessCaseIdParamDto {
  @ApiProperty({ description: 'Success case ID' })
  @IsString()
  id: string;
}

export class LandingStatsDto {
  @ApiPropertyOptional()
  yearsOperating?: number | null;

  @ApiPropertyOptional()
  maxLeaseTermYears?: number | null;

  @ApiProperty()
  totalProperties: number;

  @ApiProperty()
  availableProperties: number;

  @ApiProperty()
  averageRoi: number;

  @ApiPropertyOptional()
  roiMin?: number | null;

  @ApiPropertyOptional()
  roiMax?: number | null;

  @ApiProperty()
  totalInvestedValue: number;

  @ApiProperty()
  totalProfit: number;

  @ApiProperty()
  activeContracts: number;

  @ApiProperty()
  occupancyRate: number;

  @ApiProperty({ type: String, format: 'date-time' })
  generatedAt: Date;
}

export class UpdateLandingStatsDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOperating?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxLeaseTermYears?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalProperties?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  availableProperties?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageRoi?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  roiMin?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  roiMax?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalInvestedValue?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  totalProfit?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  activeContracts?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  occupancyRate?: number | null;
}

export class AdminLandingStatsDto extends UpdateLandingStatsDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class LandingPropertyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  area?: string | null;

  @ApiPropertyOptional()
  buildingName?: string | null;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiProperty()
  contractValue: number;

  @ApiPropertyOptional()
  netRoiMin?: number | null;

  @ApiPropertyOptional()
  netRoiMax?: number | null;

  @ApiPropertyOptional()
  isTaxFreeZone?: boolean | null;

  @ApiProperty()
  isVacant: boolean;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  vacancyRisk?: string | null;

  @ApiPropertyOptional({ type: [String] })
  keyBenefits?: string[];

  @ApiPropertyOptional()
  image?: string | null;

  @ApiPropertyOptional()
  statusLabel?: string | null;

  @ApiPropertyOptional()
  featuredRank?: number | null;
}

export class LandingEventStatDto {
  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  info?: string | null;
}

export class LandingEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  subtitle?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startsAt: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endsAt?: Date | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiPropertyOptional()
  totalMembers?: number | null;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  image: string;

  @ApiPropertyOptional({ type: [LandingEventStatDto] })
  stats?: LandingEventStatDto[];
}

export class SuccessCasePropertyLocationDto {
  @ApiPropertyOptional()
  line1?: string | null;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  country?: string | null;
}

export class SuccessCasePropertyDto {
  @ApiPropertyOptional()
  id?: string | null;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  type?: string | null;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional()
  year?: number | null;

  @ApiPropertyOptional({ type: SuccessCasePropertyLocationDto })
  location?: SuccessCasePropertyLocationDto | null;
}

export class LandingSuccessCaseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quote: string;

  @ApiProperty()
  investorName: string;

  @ApiPropertyOptional()
  investorTitle?: string | null;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiPropertyOptional()
  totalProfit?: number | null;

  @ApiPropertyOptional()
  totalRoi?: number | null;

  @ApiPropertyOptional({ type: SuccessCasePropertyDto })
  property?: SuccessCasePropertyDto | null;
}

export class LandingResponseDto {
  @ApiProperty({ type: LandingStatsDto })
  stats: LandingStatsDto;

  @ApiProperty({ type: [LandingPropertyDto] })
  properties: LandingPropertyDto[];

  @ApiProperty({ type: [LandingEventDto] })
  events: LandingEventDto[];

  @ApiProperty({ type: [LandingSuccessCaseDto] })
  successCases: LandingSuccessCaseDto[];
}

export class CreateSuccessCaseDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasConsent?: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | Date | null;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  quote: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  investorName: string;

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  investorTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  totalProfit?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  totalRoi?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  propertyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsObject()
  propertySnapshot?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpdateSuccessCaseDto extends PartialType(CreateSuccessCaseDto) {}

export class AdminSuccessCaseDto extends CreateSuccessCaseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
