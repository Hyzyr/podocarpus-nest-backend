import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

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

// ============================================================================
// TYPE EXPORTS FOR TYPESCRIPT
// ============================================================================

export type ContractDetails = z.infer<typeof ContractDetailsSchema>;
export type BuyerDetails = z.infer<typeof BuyerDetailsSchema>;
export type EmiratesId = z.infer<typeof EmiratesIdSchema>;
export type Passport = z.infer<typeof PassportSchema>;
export type Documents = z.infer<typeof DocumentsSchema>;
export type ContractFormData = z.infer<typeof ContractFormDataSchema>;

// ============================================================================
// SWAGGER DTO CLASSES FOR API DOCUMENTATION
// ============================================================================

/**
 * Contract Details DTO for Swagger documentation
 */
export class ContractDetailsDto {
  @ApiPropertyOptional({ example: true, description: 'Is lead through Green List?' })
  isLeadGreenList?: boolean;

  @ApiPropertyOptional({ enum: ['Resident', 'NonResident', 'Company'], example: 'Resident' })
  buyerType?: string;

  @ApiPropertyOptional({ example: 'Self', description: 'Who will represent at registration' })
  representationType?: string;

  @ApiPropertyOptional({ example: 'English', description: 'Preferred contact language' })
  preferredLanguage?: string;
}

/**
 * Buyer Details DTO for Swagger documentation
 */
export class BuyerDetailsDto {
  @ApiPropertyOptional({ example: false, description: 'Is person with special needs?' })
  isSpecialNeeds?: boolean;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  currentJob?: string;

  @ApiPropertyOptional({ example: 'United Arab Emirates' })
  country?: string;

  @ApiPropertyOptional({ example: 'Dubai' })
  city?: string;

  @ApiPropertyOptional({ example: 'دبي' })
  cityAr?: string;

  @ApiPropertyOptional({ example: 'Sheikh Zayed Road' })
  street?: string;

  @ApiPropertyOptional({ example: 'شارع الشيخ زايد' })
  streetAr?: string;

  @ApiPropertyOptional({ example: 'Building 123, Apt 456' })
  address?: string;

  @ApiPropertyOptional({ example: '+97143334444' })
  phoneDomestic?: string;

  @ApiPropertyOptional({ example: '+971501234567' })
  mobileDomestic?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  emailDomestic?: string;

  @ApiPropertyOptional({ example: '123' })
  extCodeDomestic?: string;

  @ApiPropertyOptional({ example: '+12125551234' })
  phoneAbroad?: string;

  @ApiPropertyOptional({ example: '+12125559876' })
  mobileAbroad?: string;

  @ApiPropertyOptional({ example: 'john.abroad@example.com' })
  emailAbroad?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  contactNameEn?: string;

  @ApiPropertyOptional({ example: 'جين دو' })
  contactNameAr?: string;

  @ApiPropertyOptional({ example: 'Spouse' })
  relationType?: string;

  @ApiPropertyOptional({ example: '+971509876543' })
  mobileEmergency?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  emailEmergency?: string;
}

/**
 * Emirates ID DTO for Swagger documentation
 */
export class EmiratesIdDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  nameEn?: string;

  @ApiPropertyOptional({ example: 'جون دو' })
  nameAr?: string;

  @ApiPropertyOptional({ example: false })
  isCitizenChild?: boolean;

  @ApiPropertyOptional({ example: 'Emirati' })
  nationality?: string;

  @ApiPropertyOptional({ example: 'Male' })
  gender?: string;

  @ApiPropertyOptional({ example: '784-1995-1234567-1' })
  idNumber?: string;

  @ApiPropertyOptional({ example: '2030-12-31' })
  expiryDate?: string;

  @ApiPropertyOptional({ example: '123456789' })
  unifiedNumber?: string;

  @ApiPropertyOptional({ example: 'FILE-2025-001' })
  fileNumber?: string;

  @ApiPropertyOptional({ example: '1995-01-15' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Dubai' })
  placeOfBirth?: string;
}

/**
 * Passport DTO for Swagger documentation
 */
export class PassportDto {
  @ApiPropertyOptional({ example: 'A1234567' })
  number?: string;

  @ApiPropertyOptional({ example: 'Ordinary' })
  passportType?: string;

  @ApiPropertyOptional({ example: 'American' })
  nationality?: string;

  @ApiPropertyOptional({ example: 'New York' })
  issuePlace?: string;

  @ApiPropertyOptional({ example: '2020-01-01' })
  issueDate?: string;

  @ApiPropertyOptional({ example: '2030-01-01' })
  expiryDate?: string;

  @ApiPropertyOptional({ example: '1995-01-15' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'New York' })
  placeOfBirth?: string;
}

/**
 * Documents DTO for Swagger documentation
 */
export class DocumentsDto {
  @ApiPropertyOptional({ example: 'https://cdn.example.com/emirates-id.pdf' })
  emiratesIdCopy?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/passport.pdf' })
  passportCopy?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/visa.pdf' })
  visaCopy?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/utility.pdf' })
  utilityBill?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/bank.pdf' })
  bankStatement?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/photo.jpg' })
  personalPhoto?: string;
}

/**
 * Complete Contract Form Data DTO for Swagger documentation
 */
export class ContractFormDataDto {
  @ApiPropertyOptional({ type: () => ContractDetailsDto })
  contractDetails?: ContractDetailsDto;

  @ApiPropertyOptional({ type: () => BuyerDetailsDto })
  buyerDetails?: BuyerDetailsDto;

  @ApiPropertyOptional({ type: () => EmiratesIdDto })
  emiratesId?: EmiratesIdDto;

  @ApiPropertyOptional({ type: () => PassportDto })
  passportId?: PassportDto;

  @ApiPropertyOptional({ type: () => DocumentsDto })
  documents?: DocumentsDto;
}

// ============================================================================
// KYC AUTOFILL DTO
// ============================================================================

/**
 * Response DTO for KYC autofill data - mapped to contract form structure
 */
export class KycAutofillDataDto {
  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'uuid' })
  kycProfileId: string;

  @ApiPropertyOptional({ 
    type: () => ContractDetailsDto,
    description: 'Contract details section (not stored in KYC, will be undefined)' 
  })
  contractDetails?: ContractDetails;

  @ApiPropertyOptional({ 
    type: () => BuyerDetailsDto,
    description: 'Buyer details section (not stored in KYC, will be undefined)' 
  })
  buyerDetails?: BuyerDetails;

  @ApiPropertyOptional({ 
    type: () => EmiratesIdDto,
    description: 'Emirates ID information from KYC profile' 
  })
  emiratesId?: EmiratesId;

  @ApiPropertyOptional({ 
    type: () => PassportDto,
    description: 'Passport information from KYC profile' 
  })
  passportId?: Passport;

  @ApiPropertyOptional({ 
    type: () => DocumentsDto,
    description: 'Document URLs from KYC profile' 
  })
  documents?: Documents;
}
