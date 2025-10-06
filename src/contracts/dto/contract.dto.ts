import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '@prisma/client';

export const ContractIdParamDto = {} 
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
  startDate?: Date | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Contract end date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date | null;

  @ApiPropertyOptional({ type: Number, example: 500000 })
  @IsOptional()
  @Type(() => Number)
  price?: number | null;

  @ApiProperty({
    enum: ContractStatus,
    example: ContractStatus.pending,
  })
  status: ContractStatus;

  @ApiPropertyOptional({
    example: 'Contract signed and awaiting final verification',
  })
  @IsOptional()
  notes?: string | null;

  // ✅ You can expand this with nested property/investor later
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

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startDate?: Date | null;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endDate?: Date | null;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  price?: number | null;

  @ApiPropertyOptional({
    enum: ContractStatus,
    default: ContractStatus.pending,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateContractDto extends CreateContractDto {}
