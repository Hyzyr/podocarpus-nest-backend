import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '@prisma/client';
import { InvestorPropertyDto } from 'src/investments/dto/investments.dto';
import { InvestorProfileWithUserDto } from 'src/users/dto/investorProfile.dto';

export const ContractIdParamDto = {};
export class ContractDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid', description: 'Related property ID' })
  propertyId: string;

  @ApiProperty({ example: 'uuid', description: 'Investor ID' })
  investorId: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Broker ID' })
  @IsOptional()
  brokerId?: string | null;

  @ApiProperty({ example: 'CN-2025-001', description: 'Unique contract code' })
  contractCode: string;

  @ApiPropertyOptional({
    example: 'https://example.com/contract.pdf',
    description: 'Link to contract file',
  })
  @IsOptional()
  contractLink?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/uploads/file.pdf',
    description: 'Uploaded file URL',
  })
  @IsOptional()
  fileUrl?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Date the contract was signed',
  })
  @IsOptional()
  @IsDateString()
  signedDate?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Contract start date',
  })
  @IsOptional()
  @IsDateString()
  contractStart?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Contract end date',
  })
  @IsOptional()
  @IsDateString()
  contractEnd?: Date | null;

  @ApiPropertyOptional({
    type: Number,
    example: 500000,
    description: 'Total investment amount',
  })
  @IsOptional()
  @Type(() => Number)
  contractValue?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50000,
    description: 'Initial deposit paid by investor',
  })
  @IsOptional()
  @Type(() => Number)
  depositPaid?: number | null;

  @ApiPropertyOptional({
    example: 'Bank Transfer',
    description: 'How investor pays (e.g., Bank Transfer, Installments)',
  })
  @IsOptional()
  investorPaymentMethod?: string | null;

  @ApiPropertyOptional({
    example: 'Monthly',
    description: 'Payment schedule (e.g., Monthly, Quarterly, Annual)',
  })
  @IsOptional()
  paymentSchedule?: string | null;

  @ApiPropertyOptional({
    example: 'Low',
    description: 'Vacancy risk assessment (Low, Medium, High)',
  })
  @IsOptional()
  vacancyRiskLevel?: string | null;

  @ApiProperty({
    enum: ContractStatus,
    example: ContractStatus.pending,
  })
  status: ContractStatus;

  @ApiPropertyOptional({
    type: String,
    example: 'Contract signed and awaiting verification',
  })
  @IsOptional()
  notes?: string | null;
}

// when fetched from InvestorProfile
export class ContractWithProperties extends ContractDto {
  @ApiProperty({
    type: () => InvestorPropertyDto,
    description: 'Contracts for Properties',
  })
  property: InvestorPropertyDto;
}

// when fetched from Property
export class ContractWithInvestor extends ContractDto {
  @ApiProperty({
    type: () => InvestorProfileWithUserDto,
    description: 'Investor Profile',
  })
  investor: InvestorProfileWithUserDto;
}
// when fetched from Property
export class ContractWithRelations extends ContractDto {
  @ApiProperty({
    type: () => InvestorPropertyDto,
    description: 'Contracts for Properties',
  })
  property: InvestorPropertyDto;

  @ApiProperty({
    type: () => InvestorProfileWithUserDto,
    description: 'Investor Profile',
  })
  investor: InvestorProfileWithUserDto;
}

export class CreateContractDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  investorId: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  brokerId?: string | null;

  @ApiProperty({ example: 'CN-2025-001' })
  @IsString()
  contractCode: string;

  @ApiPropertyOptional({ example: 'https://example.com/contract.pdf' })
  @IsOptional()
  @IsString()
  contractLink?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/uploads/file.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string | null;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  signedDate?: Date | null;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Contract start date',
  })
  @IsOptional()
  @IsDateString()
  contractStart?: Date | null;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Contract end date',
  })
  @IsOptional()
  @IsDateString()
  contractEnd?: Date | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Total investment amount',
  })
  @IsOptional()
  @Type(() => Number)
  contractValue?: number | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Initial deposit paid by investor',
  })
  @IsOptional()
  @Type(() => Number)
  depositPaid?: number | null;

  @ApiPropertyOptional({
    description: 'How investor pays',
  })
  @IsOptional()
  @IsString()
  investorPaymentMethod?: string | null;

  @ApiPropertyOptional({
    description: 'Payment schedule (Monthly, Quarterly, Annual)',
  })
  @IsOptional()
  @IsString()
  paymentSchedule?: string | null;

  @ApiPropertyOptional({
    description: 'Vacancy risk assessment (Low, Medium, High)',
  })
  @IsOptional()
  @IsString()
  vacancyRiskLevel?: string | null;

  @ApiPropertyOptional({
    enum: ContractStatus,
    default: ContractStatus.pending,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    type: String,
    example: 'Contract signed and awaiting verification',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateContractDto extends PartialType(CreateContractDto) {}
