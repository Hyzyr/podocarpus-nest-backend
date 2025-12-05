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
}).passthrough(); // Allow additional fields if needed in future

/**
 * Contact information schema - matches UserKycProfile.contactInfo structure
 * Now supports both flat (for UI) and nested (for backward compatibility)
 */
export const ContactInfoSchema = z.object({
  preferredLanguage: z.string().trim().optional(),
  // Flat fields for easier UI binding
  mobile: z.string().trim().optional(),
  phone: z.string().trim().optional(), // secondary phone
  email: z.string().email().optional(),
  // Keep nested for backward compatibility
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
  zipCode: z.string().trim().optional(),
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
 * Buyer/investor schema for contract form - matches form fields exactly
 */
export const BuyerSchema = z.object({
  buyerType: z.enum(['Resident', 'NonResident', 'Company']).optional(),
  emiratesId: EmiratesIdSchema.optional(),
  passport: PassportSchema.optional(),
  workInfo: WorkInfoSchema.optional(),
  contactInfo: ContactInfoSchema.optional(),
  address: AddressSchema.optional(),
  emergencyContact: EmergencyContactSchema.optional(),
}).passthrough();

/**
 * Complete contract form data schema - single buyer only
 * This is stored in Contract.formData as JSON
 */
export const ContractFormDataSchema = z.object({
  leadSource: z.string().trim().optional(), // "Green List", "First Time Home Buyer"
  buyer: BuyerSchema.optional(),
  contractLanguage: z.string().optional(), // "English", "Arabic", "Both"
  socialInfo: z.object({
    isDeterminedOnePeopleWithSpecialNeeds: z.boolean().optional(),
  }).passthrough().optional(),
}).passthrough();

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
    description: 'Complete form data including buyer information. Buyer can be in flat format (from UI) or nested format (stored in DB). The API auto-converts flat to nested.',
    examples: {
      nested: {
        summary: 'Nested format (stored in DB)',
        value: {
          leadSource: 'Green List',
          buyer: {
            buyerType: 'Resident',
            emiratesId: {
              nameEn: 'John Doe',
              idNumber: '784-1995-1234567-1',
              nationality: 'Emirati',
            },
            contactInfo: {
              mobile: '+971501234567',
              email: 'john@example.com'
            }
          }
        }
      },
      flat: {
        summary: 'Flat format (from UI form)',
        value: {
          leadSource: 'Green List',
          buyer: {
            buyerType: 'Resident',
            fullNameEn: 'John Doe',
            emiratesId: '784-1995-1234567-1',
            nationality: 'Emirati',
            mobile: '+971501234567',
            email: 'john@example.com',
            city: 'Dubai',
            street: 'Sheikh Zayed Road'
          }
        }
      }
    }
  })
  @IsOptional()
  @IsObject()
  formData?: ContractFormData | { buyer: BuyerForm; [key: string]: any };

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

// ============================================================================
// FLAT DTOs FOR UI FORM BINDING
// ============================================================================

/**
 * Flat buyer DTO that matches your UI structure exactly
 * Use this for API requests from the frontend form
 */
export class BuyerFormDto {
  // Basic Info
  @ApiPropertyOptional({ enum: ['Resident', 'NonResident', 'Company'] })
  @IsOptional()
  @IsString()
  buyerType?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullNameEn?: string;

  @ApiPropertyOptional({ example: 'جون دو' })
  @IsOptional()
  @IsString()
  fullNameAr?: string;

  @ApiPropertyOptional({ example: 'Emirati' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isCitizenChild?: boolean;

  @ApiPropertyOptional({ enum: ['Male', 'Female'] })
  @IsOptional()
  @IsString()
  gender?: string;

  // Identification
  @ApiPropertyOptional({ example: '784-1995-1234567-1' })
  @IsOptional()
  @IsString()
  emiratesId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  emiratesIdExpiry?: string;

  @ApiPropertyOptional({ example: 'A1234567' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  passportIssueDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPropertyOptional({ example: 'American' })
  @IsOptional()
  @IsString()
  passportNationality?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  // Contact Information
  @ApiPropertyOptional({ example: '+971501234567' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: '+97143001234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'United Arab Emirates' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Dubai' })
  @IsOptional()
  @IsString()
  city?: string;

  // Employment / Work Info
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  currentJob?: string;

  // Address
  @ApiPropertyOptional({ example: 'Sheikh Zayed Road' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'دبي' })
  @IsOptional()
  @IsString()
  cityArabic?: string;

  @ApiPropertyOptional({ example: 'Burj Khalifa' })
  @IsOptional()
  @IsString()
  buildingName?: string;

  @ApiPropertyOptional({ example: '501' })
  @IsOptional()
  @IsString()
  apartmentNo?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'P.O. Box 123456' })
  @IsOptional()
  @IsString()
  poBox?: string;

  // Emergency Contact (keep as nested object)
  @ApiPropertyOptional({
    type: Object,
    example: {
      nameEn: 'Jane Doe',
      mobile: '+971501234568',
      relationType: 'Spouse'
    }
  })
  @IsOptional()
  @IsObject()
  emergencyContact?: EmergencyContact;
}

/**
 * Zod schema for flat buyer form validation
 */
export const BuyerFormSchema = z.object({
  // Basic Info
  buyerType: z.enum(['Resident', 'NonResident', 'Company']).optional(),
  fullNameEn: z.string().trim().optional(),
  fullNameAr: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  isCitizenChild: z.boolean().optional(),
  gender: z.enum(['Male', 'Female']).optional(),

  // Identification
  emiratesId: z.string().trim().optional(),
  emiratesIdExpiry: z.string().optional(),
  passportNumber: z.string().trim().optional(),
  passportIssueDate: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  passportNationality: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),

  // Contact Information
  mobile: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),

  // Employment
  currentJob: z.string().trim().optional(),

  // Address
  street: z.string().trim().optional(),
  cityArabic: z.string().trim().optional(),
  buildingName: z.string().trim().optional(),
  apartmentNo: z.string().trim().optional(),
  zipCode: z.string().trim().optional(),
  poBox: z.string().trim().optional(),

  // Emergency Contact
  emergencyContact: EmergencyContactSchema.optional(),
}).passthrough();

export type BuyerForm = z.infer<typeof BuyerFormSchema>;
