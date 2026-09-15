import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUUID,
  MaxLength,
  IsString,
  IsPositive,
} from 'class-validator';
import { PaymentType } from '@prisma/client';

/**
 * Record money received.
 *
 * Use this for a custom or off-schedule collection. To settle a date that is
 * already on the lease's schedule, prefer
 * `POST /payments/installments/:id/collect` — it defaults the amount to the
 * outstanding balance and updates the installment in one call.
 */
export class CreatePaymentDto {
  @ApiProperty({ description: 'Tenant lease ID' })
  @IsUUID()
  tenantLeaseId: string;

  @ApiPropertyOptional({
    description:
      'Scheduled installment this payment settles. Leave empty for an ad-hoc collection; the payment still counts toward the lease total.',
  })
  @IsOptional()
  @IsUUID()
  installmentId?: string;

  @ApiProperty({ description: 'Amount paid (AED)', example: 60000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Date of payment', format: 'date-time' })
  @IsDateString()
  paidDate: string;

  @ApiProperty({
    description: 'Period this payment covers',
    enum: PaymentType,
  })
  @IsEnum(PaymentType)
  type: PaymentType;

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

  @ApiPropertyOptional({ description: 'Optional note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/**
 * Correct a recorded payment.
 *
 * Changing the amount or the linked installment re-derives that installment's
 * status, so a correction never leaves a stale PAID.
 */
export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: 'Amount paid (AED)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ description: 'Date of payment', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({
    description: 'Period this payment covers',
    enum: PaymentType,
  })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({
    description:
      'Re-point this payment at another scheduled installment. Send null to detach it.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  installmentId?: string | null;

  @ApiPropertyOptional({ description: 'How it was paid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  method?: string;

  @ApiPropertyOptional({
    description: 'Cheque number or transaction reference',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Optional note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
