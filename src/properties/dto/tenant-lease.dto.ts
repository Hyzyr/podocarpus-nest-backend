import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsPositive,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { GenerateScheduleDto } from 'src/payments/dto/rent-schedule.dto';

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

  @ApiProperty({
    description:
      'Annual rent amount (total for the year). The single money figure on the lease — monthly views derive from it.',
    example: 60000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  annualRent: number;

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

  @ApiPropertyOptional({
    type: GenerateScheduleDto,
    description:
      'When to collect rent from this tenant. Optional — leave it out and assign the schedule later with PUT /tenant-leases/{id}/schedule. Pick a cadence (ANNUAL, SEMI_ANNUAL, QUARTERLY, BI_MONTHLY, MONTHLY) and the due dates and amounts are derived from the lease term, or use CUSTOM and supply the dates yourself.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenerateScheduleDto)
  paymentSchedule?: GenerateScheduleDto;
}

/**
 * Lease fields only. The collection schedule is managed through its own
 * endpoints so a routine lease edit can never silently rewrite payment dates.
 */
export class UpdateTenantLeaseDto extends PartialType(
  OmitType(CreateTenantLeaseDto, ['paymentSchedule'] as const),
) {}

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

export class TenantLeaseQueryDto {
  @ApiPropertyOptional({
    description: 'Days ahead to check for expiring leases',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  daysAhead?: number;
}

export class TerminateTenantLeaseDto {
  @ApiProperty({
    description: 'Reason for lease termination',
    example: 'Tenant requested early termination',
  })
  @IsString()
  reason: string;
}
