import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PublicPropertyDto } from './property.get.dto';

export class PropertyIdParamDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  id: string;
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

  @ApiPropertyOptional({ description: 'True/false - filter by enabled status' })
  @IsOptional()
  @Type(() => Boolean)
  isEnabled?: boolean;

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
  sortBy?: keyof PublicPropertyDto | string;

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
