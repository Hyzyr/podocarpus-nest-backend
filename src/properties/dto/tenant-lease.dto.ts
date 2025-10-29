import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsEmail,
} from 'class-validator';

export class CreateTenantLeaseDto {
  @ApiProperty({ description: 'Property ID this lease belongs to' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Tenant full name' })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiPropertyOptional({ description: 'Tenant email address' })
  @IsOptional()
  @IsEmail()
  tenantEmail?: string;

  @ApiPropertyOptional({ description: 'Tenant phone number' })
  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @ApiProperty({ description: 'Lease start date', format: 'date-time' })
  @IsDateString()
  leaseStart: string;

  @ApiPropertyOptional({ description: 'Lease end date', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  leaseEnd?: string;

  @ApiProperty({ description: 'Monthly rent amount', example: 5000 })
  @Type(() => Number)
  @IsNumber()
  monthlyRent: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Bank Transfer',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Security deposit amount',
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({
    description: 'Lease active status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Was lease terminated early?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  terminatedEarly?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for early termination',
  })
  @IsOptional()
  @IsString()
  terminationReason?: string;
}

export class UpdateTenantLeaseDto extends PartialType(CreateTenantLeaseDto) {}

export class TenantLeaseParamDto {
  @ApiProperty({ description: 'Tenant Lease ID' })
  @IsString()
  id: string;
}

export class PropertyTenantLeasesQueryDto {
  @ApiProperty({ description: 'Property ID to get tenant leases for' })
  @IsString()
  propertyId: string;
}
