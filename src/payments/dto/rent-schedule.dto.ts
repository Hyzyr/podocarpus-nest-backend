import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { InstallmentStatus, PaymentType, RentFrequency } from '@prisma/client';
import { MAX_INSTALLMENTS } from '../rent-schedule.util';

/* -------------------------------------------------------------------------- */
/*  Requests                                                                   */
/* -------------------------------------------------------------------------- */

/** One hand-entered due date, used when `frequency` is `CUSTOM`. */
export class CustomInstallmentDto {
  @ApiProperty({
    description: 'When this collection is due',
    format: 'date-time',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Amount expected (AED)', example: 15000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountDue: number;

  @ApiPropertyOptional({
    description: 'First day of the rental period this covers',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Last day of the rental period this covers',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({ description: 'Admin note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * Build (or rebuild) the collection schedule for a lease.
 *
 * With any frequency other than `CUSTOM` the due dates and amounts are derived
 * from the lease term; with `CUSTOM` you supply `installments` yourself.
 */
export class GenerateScheduleDto {
  @ApiProperty({
    enum: RentFrequency,
    description:
      'How often rent is collected per year. ANNUAL=1, SEMI_ANNUAL=2, QUARTERLY=4, BI_MONTHLY=6, MONTHLY=12, CUSTOM=your own dates.',
    example: RentFrequency.QUARTERLY,
  })
  @IsEnum(RentFrequency)
  frequency: RentFrequency;

  @ApiPropertyOptional({
    description:
      'Total rent expected per 12 months (AED). Defaults to the lease annualRent. Ignored for CUSTOM.',
    example: 120000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  annualAmount?: number;

  @ApiPropertyOptional({
    description:
      'Date of the first collection. Defaults to the lease start date. Ignored for CUSTOM.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  firstDueDate?: string;

  @ApiPropertyOptional({
    description:
      'Force every due date onto this day of month (1-28). Leave empty to keep the day of the first due date.',
    minimum: 1,
    maximum: 28,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  anchorDay?: number;

  @ApiPropertyOptional({
    description:
      'Exact number of installments to create. Defaults to covering the lease term (one year when the lease has no end date). Ignored for CUSTOM.',
    minimum: 1,
    maximum: MAX_INSTALLMENTS,
    example: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  count?: number;

  @ApiPropertyOptional({
    type: [CustomInstallmentDto],
    description: 'Required when frequency is CUSTOM. Ignored otherwise.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INSTALLMENTS)
  @ValidateNested({ each: true })
  @Type(() => CustomInstallmentDto)
  installments?: CustomInstallmentDto[];

  @ApiPropertyOptional({
    description:
      'Replace a schedule that already has payments recorded against it. Without this, regenerating a partly-collected schedule is refused with 409.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

/** Edit a single scheduled collection - move it, reprice it, waive it. */
export class UpdateInstallmentDto {
  @ApiPropertyOptional({ description: 'New due date', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'New expected amount (AED)',
    example: 20000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountDue?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({
    enum: InstallmentStatus,
    description:
      'Only WAIVED, CANCELLED and PENDING may be set by hand. PAID and PARTIAL are derived from the payments recorded against the installment.',
  })
  @IsOptional()
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus;

  @ApiPropertyOptional({ description: 'Admin note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Accept money against a scheduled collection. */
export class CollectInstallmentDto {
  @ApiPropertyOptional({
    description:
      'Amount received (AED). Defaults to the outstanding balance of the installment.',
    example: 30000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({
    description: 'When the money arrived. Defaults to now.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({
    enum: PaymentType,
    description:
      'Period this payment covers. Defaults to the lease payment frequency.',
  })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({
    description: 'How it was paid',
    example: 'Bank Transfer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  method?: string;

  @ApiPropertyOptional({
    description: 'Cheque number or transaction reference',
    example: 'CHQ-004821',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Admin note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Filters for the installment list. */
export class InstallmentQueryDto {
  @ApiPropertyOptional({ description: 'Only installments on this lease' })
  @IsOptional()
  @IsUUID()
  leaseId?: string;

  @ApiPropertyOptional({ description: 'Only installments on this property' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    enum: InstallmentStatus,
    description: 'Stored status',
  })
  @IsOptional()
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus;

  @ApiPropertyOptional({
    description: 'Due on or after this date',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Due on or before this date',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Only unsettled installments whose due date has passed',
    default: false,
  })
  @IsOptional()
  // Not `@Type(() => Boolean)` — that turns the string "false" into true.
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : value === true || value === 'true' || value === '1',
  )
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Window and scope for the collection dashboard. */
export class PaymentsDashboardQueryDto {
  @ApiPropertyOptional({
    description:
      'Calendar year to report on. Ignored when from/to are supplied. Defaults to the current year.',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Window start', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Window end', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Limit the report to one property' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'How far ahead the upcoming list reaches, in days',
    default: 60,
    example: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  upcomingDays?: number;

  @ApiPropertyOptional({
    description:
      'How many rows each of upcoming, overdue and recentPayments returns',
    default: 10,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  listSize?: number;
}
