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
} from 'class-validator';
import { PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Tenant lease ID' })
  @IsUUID()
  tenantLeaseId: string;

  @ApiProperty({ description: 'Amount paid (AED)', example: 60000 })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Date of payment', format: 'date-time' })
  @IsDateString()
  paidDate: string;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({ description: 'Optional note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ description: 'Amount paid (AED)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Date of payment', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({ description: 'Payment type', enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({ description: 'Optional note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
