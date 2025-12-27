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
import { z } from 'zod';

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

// ============================================================================
// ZOD SCHEMAS FOR CONTRACT FORM DATA
// ============================================================================

/**
 * Contract Details Schema - Top-level contract information
 */
export const ContractDetailsSchema = z.object({
  isLeadGreenList: z.boolean().optional(), // Is lead through Green List?
  buyerType: z.enum(['Resident', 'NonResident', 'Company']).optional(),
  representationType: z.string().trim().optional(), // Who will represent at registration
  preferredLanguage: z.string().trim().optional(), // Contact Preferred Language
}).passthrough();

/**
 * Buyer Details Schema - Consolidated buyer information
 * Includes social info, employment, address, contact info, and emergency contact
 */
export const BuyerDetailsSchema = z.object({
  // Social & Employment
  isSpecialNeeds: z.boolean().optional(), // Is determined Ones (Special Needs)?
  currentJob: z.string().trim().optional(),
  
  // Address
  country: z.string().trim().optional(), // Country of Residence
  city: z.string().trim().optional(), // City (English)
  cityAr: z.string().trim().optional(), // City (Arabic)
  street: z.string().trim().optional(), // Street (English)
  streetAr: z.string().trim().optional(), // Street (Arabic)
  address: z.string().trim().optional(), // Full address
  
  // Contact - Domestic
  phoneDomestic: z.string().trim().optional(),
  mobileDomestic: z.string().trim().optional(),
  emailDomestic: z.string().email().optional(),
  extCodeDomestic: z.string().trim().optional(),
  
  // Contact - Abroad
  phoneAbroad: z.string().trim().optional(),
  mobileAbroad: z.string().trim().optional(),
  emailAbroad: z.string().email().optional(),
  
  // Emergency Contact
  contactNameEn: z.string().trim().optional(),
  contactNameAr: z.string().trim().optional(),
  relationType: z.string().trim().optional(),
  mobileEmergency: z.string().trim().optional(),
  emailEmergency: z.string().email().optional(),
}).passthrough();

/**
 * Emirates ID Schema - Clean structure matching form
 */
export const EmiratesIdSchema = z.object({
  nameEn: z.string().trim().optional(),
  nameAr: z.string().trim().optional(),
  isCitizenChild: z.boolean().optional(),
  nationality: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  idNumber: z.string().trim().optional(),
  expiryDate: z.string().optional(), // Date string
  unifiedNumber: z.string().trim().optional(),
  fileNumber: z.string().trim().optional(),
  dateOfBirth: z.string().optional(), // Date string
  placeOfBirth: z.string().trim().optional(),
}).passthrough();

/**
 * Passport Schema - Clean structure matching form
 */
export const PassportSchema = z.object({
  number: z.string().trim().optional(),
  passportType: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  issuePlace: z.string().trim().optional(),
  issueDate: z.string().optional(), // Date string
  expiryDate: z.string().optional(), // Date string
  dateOfBirth: z.string().optional(), // Date string
  placeOfBirth: z.string().trim().optional(),
}).passthrough();

/**
 * Documents Schema - Specific document types
 */
export const DocumentsSchema = z.object({
  emiratesIdCopy: z.string().optional(), // File URL
  passportCopy: z.string().optional(), // File URL
  visaCopy: z.string().optional(), // File URL
  utilityBill: z.string().optional(), // File URL
  bankStatement: z.string().optional(), // File URL
  personalPhoto: z.string().optional(), // File URL
}).passthrough();

/**
 * Complete Contract Form Data Schema
 * This is stored in Contract.formData as JSON
 */
export const ContractFormDataSchema = z.object({
  contractDetails: ContractDetailsSchema.optional(),
  buyerDetails: BuyerDetailsSchema.optional(),
  emiratesId: EmiratesIdSchema.optional(),
  passportId: PassportSchema.optional(),
  documents: DocumentsSchema.optional(),
}).passthrough();

// Type exports for TypeScript
export type ContractDetails = z.infer<typeof ContractDetailsSchema>;
export type BuyerDetails = z.infer<typeof BuyerDetailsSchema>;
export type EmiratesId = z.infer<typeof EmiratesIdSchema>;
export type Passport = z.infer<typeof PassportSchema>;
export type Documents = z.infer<typeof DocumentsSchema>;
export type ContractFormData = z.infer<typeof ContractFormDataSchema>;

// ============================================================================
// ENHANCED CREATE CONTRACT DTO WITH FORM DATA
// ============================================================================

export class CreateContractWithFormDataDto extends CreateContractDto {
  @ApiPropertyOptional({
    description: 'Complete contract form data with new structure',
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

// ============================================================================
// KYC AUTOFILL DTOs - Returns data from UserKycProfile to autofill contract form
// ============================================================================

/**
 * Response DTO for KYC autofill data - mapped to new contract form structure
 */
export class KycAutofillDataDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'uuid' })
  kycProfileId: string;

  @ApiPropertyOptional({ description: 'Contract details section' })
  contractDetails?: ContractDetails;

  @ApiPropertyOptional({ description: 'Buyer details section' })
  buyerDetails?: BuyerDetails;

  @ApiPropertyOptional({ description: 'Emirates ID information' })
  emiratesId?: EmiratesId;

  @ApiPropertyOptional({ description: 'Passport information' })
  passportId?: Passport;

  @ApiPropertyOptional({ description: 'Document URLs' })
  documents?: Documents;
}
