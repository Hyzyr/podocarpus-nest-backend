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
 * Emirates ID schema - matches UserKycProfile.emiratesId structure
 */
export const EmiratesIdSchema = z.object({
  nameEn: z.string().trim().min(1).optional(),
  nameAr: z.string().trim().optional(),
  isCitizenChild: z.boolean().optional(),
  nationality: z.string().trim().optional(),
  idNumber: z.string().trim().optional(),
  unifiedNumber: z.string().trim().optional(),
  fileNumber: z.string().trim().optional(),
  placeOfBirth: z.string().trim().optional(),
  dob: z.string().datetime().optional(), // ISO string
  expiryDate: z.string().datetime().optional(), // ISO string
  gender: z.enum(['Male', 'Female']).optional(),
}).passthrough();

/**
 * Passport schema - matches UserKycProfile.passport structure
 */
export const PassportSchema = z.object({
  number: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  placeOfIssue: z.string().trim().optional(),
  type: z.string().trim().optional(), // "Regular", "Diplomatic", etc.
  dob: z.string().datetime().optional(),
});

/**
 * Work information schema - matches UserKycProfile.workInfo structure
 */
export const WorkInfoSchema = z.object({
  currentJob: z.string().trim().optional(),
  employer: z.string().trim().optional(),
  position: z.string().trim().optional(),
  salary: z.number().optional(),
  yearsOfExperience: z.number().optional(),
}).passthrough(); // Allow additional fields

/**
 * Contact information schema - matches UserKycProfile.contactInfo structure
 */
export const ContactInfoSchema = z.object({
  preferredLanguage: z.string().trim().optional(),
  domestic: z.object({
    phone: z.string().trim().optional(),
    email: z.string().email().optional(),
    mobile: z.string().trim().optional(),
  }).partial().optional(),
  abroad: z.object({
    phone: z.string().trim().optional(),
    email: z.string().email().optional(),
    mobile: z.string().trim().optional(),
  }).partial().optional(),
}).passthrough();

/**
 * Address schema - matches UserKycProfile.address structure
 */
export const AddressSchema = z.object({
  countryOfResidence: z.string().trim().optional(),
  city: z.string().trim().optional(),
  cityArabic: z.string().trim().optional(),
  street: z.string().trim().optional(),
  streetArabic: z.string().trim().optional(),
  buildingName: z.string().trim().optional(),
  apartmentNo: z.string().trim().optional(),
  poBox: z.string().trim().optional(),
}).passthrough();

/**
 * Emergency contact schema - matches UserKycProfile.emergencyContact structure
 */
export const EmergencyContactSchema = z.object({
  nameEn: z.string().trim().optional(),
  nameAr: z.string().trim().optional(),
  relationType: z.string().trim().optional(), // "Spouse", "Parent", "Sibling", etc.
  mobile: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
}).passthrough();

/**
 * Documents schema - stores file URLs
 */
export const DocumentsSchema = z.record(z.string(), z.string().url()).optional();

/**
 * Single buyer/investor schema for contract form
 * Can reference existing KYC profile or include new data
 */
export const BuyerSchema = z.object({
  // Reference to existing user (if buyer is already registered)
  userId: z.string().uuid().optional(),
  kycProfileId: z.string().uuid().optional(),

  // Buyer type and role
  buyerType: z.enum(['Resident', 'NonResident', 'Company']).optional(),
  role: z.string().optional(), // "Primary", "Co-buyer", "Representative"

  // Identity information (can override KYC or be standalone)
  emiratesId: EmiratesIdSchema.optional(),
  passport: PassportSchema.optional(),

  // Contact and personal info
  workInfo: WorkInfoSchema.optional(),
  contactInfo: ContactInfoSchema.optional(),
  address: AddressSchema.optional(),
  emergencyContact: EmergencyContactSchema.optional(),

  // Documents specific to this contract
  documents: DocumentsSchema,

  // Additional fields for contract context
  representativeCapacity: z.string().optional(), // "Owner", "Attorney", "Guardian"
  powerOfAttorneyDetails: z.string().optional(),
}).passthrough(); // Allow additional buyer-specific fields

/**
 * Complete contract form data schema
 * This is stored in Contract.formData as JSON
 */
export const ContractFormDataSchema = z.object({
  // Lead source
  leadSource: z.string().trim().optional(), // "Green List", "First Time Home Buyer"

  // Multiple buyers support
  buyers: z.array(BuyerSchema).min(1).optional(),

  // Primary buyer (for backward compatibility or quick access)
  buyer1: BuyerSchema.optional(),
  buyer2: BuyerSchema.optional(),

  // Contract-specific fields from your form
  contractLanguage: z.string().optional(), // "English", "Arabic", "Both"

  // Social information
  socialInfo: z.object({
    isDeterminedOnePeopleWithSpecialNeeds: z.boolean().optional(),
  }).passthrough().optional(),

  // Additional contract metadata
  metadata: z.record(z.string(), z.any()).optional(),
}).passthrough(); // Allow additional dynamic form fields

/**
 * Schema for contract terms (Contract.terms JSON field)
 */
export const ContractTermsSchema = z.object({
  clauses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number().optional(),
  })).optional(),
  schedules: z.array(z.object({
    type: z.string(), // "payment", "milestone", "inspection"
    date: z.string().datetime(),
    description: z.string(),
    amount: z.number().optional(),
  })).optional(),
  specialConditions: z.string().optional(),
  legalNotes: z.string().optional(),
}).passthrough();

/**
 * Schema for contract metadata (Contract.metadata JSON field)
 */
export const ContractMetadataSchema = z.object({
  currency: z.string().default('AED'),
  tags: z.array(z.string()).optional(),
  uiHints: z.record(z.string(), z.any()).optional(),
  internalNotes: z.string().optional(),
  source: z.string().optional(), // "web", "mobile", "admin-panel"
  version: z.string().optional(),
}).passthrough();

// Type exports for TypeScript
export type EmiratesId = z.infer<typeof EmiratesIdSchema>;
export type Passport = z.infer<typeof PassportSchema>;
export type WorkInfo = z.infer<typeof WorkInfoSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type Buyer = z.infer<typeof BuyerSchema>;
export type ContractFormData = z.infer<typeof ContractFormDataSchema>;
export type ContractTerms = z.infer<typeof ContractTermsSchema>;
export type ContractMetadata = z.infer<typeof ContractMetadataSchema>;

// ============================================================================
// ENHANCED CREATE CONTRACT DTO WITH FORM DATA
// ============================================================================

export class CreateContractWithFormDataDto extends CreateContractDto {
  @ApiPropertyOptional({
    description: 'Complete form data including buyer information, documents, etc.',
    example: {
      leadSource: 'Green List',
      buyers: [{
        buyerType: 'Resident',
        emiratesId: {
          nameEn: 'John Doe',
          idNumber: '784-1995-1234567-1',
          nationality: 'Emirati',
        },
        contactInfo: {
          preferredLanguage: 'English',
          domestic: { email: 'john@example.com', mobile: '+971501234567' }
        }
      }]
    }
  })
  @IsOptional()
  @IsObject()
  formData?: ContractFormData;

  @ApiPropertyOptional({
    description: 'Contract terms, clauses, and schedules',
    example: {
      clauses: [],
      schedules: [],
      specialConditions: 'Property must be vacant within 30 days'
    }
  })
  @IsOptional()
  @IsObject()
  terms?: ContractTerms;

  @ApiPropertyOptional({
    description: 'Additional metadata (currency, tags, UI hints)',
    example: {
      currency: 'AED',
      tags: ['residential', 'dubai'],
      source: 'web'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: ContractMetadata;

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
// KYC AUTOFILL DTOs
// ============================================================================

/**
 * Response DTO for KYC autofill data
 */
export class KycAutofillDataDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'uuid' })
  kycProfileId: string;

  @ApiPropertyOptional({ example: 'Resident' })
  buyerType?: string;

  @ApiPropertyOptional({
    description: 'Emirates ID information',
    example: {
      nameEn: 'John Doe',
      idNumber: '784-1995-1234567-1',
      nationality: 'Emirati',
      expiryDate: '2025-12-31T00:00:00.000Z'
    }
  })
  emiratesId?: EmiratesId;

  @ApiPropertyOptional({
    description: 'Passport information',
    example: {
      number: 'A1234567',
      nationality: 'American',
      expiryDate: '2030-12-31T00:00:00.000Z'
    }
  })
  passport?: Passport;

  @ApiPropertyOptional({ description: 'Work information' })
  workInfo?: WorkInfo;

  @ApiPropertyOptional({ description: 'Contact information' })
  contactInfo?: ContactInfo;

  @ApiPropertyOptional({ description: 'Address information' })
  address?: Address;

  @ApiPropertyOptional({ description: 'Emergency contact' })
  emergencyContact?: EmergencyContact;

  @ApiPropertyOptional({ description: 'Document URLs' })
  documents?: Record<string, string>;
}
