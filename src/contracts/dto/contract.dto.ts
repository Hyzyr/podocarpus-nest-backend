import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '@prisma/client';
import { InvestorPropertyDto } from 'src/investments/dto/investments.dto';
import { InvestorProfileWithUserDto } from 'src/users/dto/investorProfile.dto';
import { 
  ContractFormDataDto,
} from './contract-form.dto';
import type { ContractFormData } from './contract-form.dto';

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

  @ApiPropertyOptional({
    description: 'Complete contract form data with structured sections',
    type: () => ContractFormDataDto,
    example: {
      contractDetails: {
        isLeadGreenList: true,
        buyerType: 'Resident',
        representationType: 'Self',
        preferredLanguage: 'English'
      },
      buyerDetails: {
        isSpecialNeeds: false,
        currentJob: 'Software Engineer',
        country: 'United Arab Emirates',
        city: 'Dubai',
        cityAr: 'دبي',
        street: 'Sheikh Zayed Road',
        address: 'Building 123, Apt 456',
        phoneDomestic: '+97143334444',
        mobileDomestic: '+971501234567',
        emailDomestic: 'john@example.com',
        contactNameEn: 'Jane Doe',
        relationType: 'Spouse',
        mobileEmergency: '+971509876543',
        emailEmergency: 'jane@example.com'
      },
      emiratesId: {
        nameEn: 'John Doe',
        nameAr: 'جون دو',
        isCitizenChild: false,
        nationality: 'Emirati',
        gender: 'Male',
        idNumber: '784-1995-1234567-1',
        expiryDate: '2030-12-31',
        unifiedNumber: '123456789',
        dateOfBirth: '1995-01-15',
        placeOfBirth: 'Dubai'
      },
      passportId: {
        number: 'A1234567',
        passportType: 'Ordinary',
        nationality: 'American',
        issuePlace: 'New York',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        dateOfBirth: '1995-01-15',
        placeOfBirth: 'New York'
      },
      documents: {
        emiratesIdCopy: 'https://cdn.example.com/emirates-id.pdf',
        passportCopy: 'https://cdn.example.com/passport.pdf',
        visaCopy: 'https://cdn.example.com/visa.pdf',
        utilityBill: 'https://cdn.example.com/utility.pdf',
        bankStatement: 'https://cdn.example.com/bank.pdf',
        personalPhoto: 'https://cdn.example.com/photo.jpg'
      }
    }
  })
  @IsOptional()
  @IsObject()
  formData?: ContractFormData;

  @ApiPropertyOptional({
    description: 'Array of file URLs (documents, contracts, etc.)',
    example: ['https://cdn.example.com/contract.pdf', 'https://cdn.example.com/id.pdf']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filesUrl?: string[];
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

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @ApiPropertyOptional({
    description: 'Complete contract form data with structured sections',
    type: () => ContractFormDataDto,
    example: {
      contractDetails: {
        isLeadGreenList: true,
        buyerType: 'Resident',
        representationType: 'Self',
        preferredLanguage: 'English'
      },
      buyerDetails: {
        isSpecialNeeds: false,
        currentJob: 'Software Engineer',
        country: 'United Arab Emirates',
        city: 'Dubai',
        mobileDomestic: '+971501234567',
        emailDomestic: 'john@example.com'
      },
      emiratesId: {
        nameEn: 'John Doe',
        idNumber: '784-1995-1234567-1',
        nationality: 'Emirati'
      }
    }
  })
  @IsOptional()
  @IsObject()
  formData?: ContractFormData;

  @ApiPropertyOptional({
    description: 'Array of file URLs (documents, contracts, etc.)',
    example: ['https://cdn.example.com/contract.pdf', 'https://cdn.example.com/id.pdf']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filesUrl?: string[];
}

export class CreateContractWithFormDataDto extends CreateContractDto {
  @ApiPropertyOptional({
    description: 'Complete contract form data with new structure',
    type: () => ContractFormDataDto,
    example: {
      contractDetails: {
        isLeadGreenList: true,
        buyerType: 'Resident',
        representationType: 'Self',
        preferredLanguage: 'English'
      },
      buyerDetails: {
        isSpecialNeeds: false,
        currentJob: 'Software Engineer',
        country: 'United Arab Emirates',
        city: 'Dubai',
        mobileDomestic: '+971501234567',
        emailDomestic: 'john@example.com'
      },
      emiratesId: {
        nameEn: 'John Doe',
        idNumber: '784-1995-1234567-1',
        nationality: 'Emirati'
      },
      passportId: {
        number: 'A1234567',
        nationality: 'American'
      },
      documents: {
        emiratesIdCopy: 'https://cdn.example.com/emirates-id.pdf',
        passportCopy: 'https://cdn.example.com/passport.pdf'
      }
    }
  })
  @IsOptional()
  @IsObject()
  formData?: ContractFormData;

  @ApiPropertyOptional({
    description: 'Array of file URLs (documents, contracts, etc.)',
    example: ['https://cdn.example.com/contract.pdf', 'https://cdn.example.com/id.pdf']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filesUrl?: string[];
}
