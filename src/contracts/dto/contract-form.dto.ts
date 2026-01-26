import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { FileAttachmentDto, FileAttachmentSchema } from '../../common/dto/file-attachment.dto';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional } from 'class-validator';

// ============================================================================
// ZOD SCHEMAS FOR CONTRACT FORM DATA
// ============================================================================

/**
 * Contract Details Schema - Top-level contract information
 */
export const ContractDetailsSchema = z.object({
  isLeadGreenList: z.boolean(), // Is lead through Green List?
  buyerType: z.enum(['Resident', 'NonResident', 'Company']),
  representationType: z.string().trim(), // Who will represent at registration
  preferredLanguage: z.string().trim(), // Contact Preferred Language
}).passthrough();

/**
 * Buyer Details Schema - Consolidated buyer information
 * Includes social info, employment, address, contact info, and emergency contact
 */
export const BuyerDetailsSchema = z.object({
  // Social & Employment
  isSpecialNeeds: z.boolean().optional(), // Is determined Ones (Special Needs)?
  currentJob: z.string().trim(),
  
  // Address
  country: z.string().trim(), // Country of Residence
  city: z.string().trim().optional(), // City (English)
  cityAr: z.string().trim().optional(), // City (Arabic)
  street: z.string().trim().optional(), // Street (English)
  streetAr: z.string().trim().optional(), // Street (Arabic)
  address: z.string().trim().optional(), // Full address
  
  // Contact - Domestic
  phoneDomestic: z.string().trim().optional(),
  mobileDomestic: z.string().trim().optional(),
  emailDomestic: z.string().email(),
  extCodeDomestic: z.string().trim(),
  
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
  nameEn: z.string().trim(),
  nameAr: z.string().trim(),
  isCitizenChild: z.boolean(),
  nationality: z.string().trim(),
  gender: z.string().trim(),
  idNumber: z.string().trim(),
  expiryDate: z.string(), // Date string
  unifiedNumber: z.string().trim().optional(),
  fileNumber: z.string().trim().optional(),
  dateOfBirth: z.string(), // Date string
  placeOfBirth: z.string().trim(),
}).passthrough();

/**
 * Passport Schema - Clean structure matching form
 */
export const PassportSchema = z.object({
  number: z.string().trim(),
  passportType: z.string().trim(),
  nationality: z.string().trim(),
  issuePlace: z.string().trim(),
  issueDate: z.string(), // Date string
  expiryDate: z.string(), // Date string
  dateOfBirth: z.string(), // Date string
  placeOfBirth: z.string().trim(),
}).passthrough();

/**
 * Documents Schema - Specific document types
 */
export const DocumentsSchema = z.object({
  emiratesIdCopy: FileAttachmentSchema,
  passportCopy: FileAttachmentSchema.optional(),
  visaCopy: FileAttachmentSchema,
  utilityBill: FileAttachmentSchema.optional(),
  bankStatement: FileAttachmentSchema.optional(),
  personalPhoto: FileAttachmentSchema.optional(),
}).passthrough();

/**
 * Complete Contract Form Data Schema
 * This is stored in Contract.formData as JSON
 */
export const ContractFormDataSchema = z.object({
  contractDetails: ContractDetailsSchema.partial().optional(),
  buyerDetails: BuyerDetailsSchema.partial().optional(),
  emiratesId: EmiratesIdSchema.partial().optional(),
  passportId: PassportSchema.partial().optional(),
  documents: DocumentsSchema.partial().optional(),
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
  @ApiProperty({ example: true, description: 'Is lead through Green List?' })
  isLeadGreenList: boolean;

  @ApiProperty({ enum: ['Resident', 'NonResident', 'Company'], example: 'Resident' })
  buyerType: 'Resident' | 'NonResident' | 'Company';

  @ApiProperty({ example: 'Self', description: 'Who will represent at registration' })
  representationType: string;

  @ApiProperty({ example: 'English', description: 'Preferred contact language' })
  preferredLanguage: string;
}

/**
 * Buyer Details DTO for Swagger documentation
 */
export class BuyerDetailsDto {
  @ApiPropertyOptional({ example: false, description: 'Is person with special needs?' })
  isSpecialNeeds?: boolean;

  @ApiProperty({ example: 'Software Engineer' })
  currentJob: string;

  @ApiProperty({ example: 'United Arab Emirates' })
  country: string;

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

  @ApiProperty({ example: 'john@example.com' })
  emailDomestic: string;

  @ApiProperty({ example: '123' })
  extCodeDomestic: string;

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
  @ApiProperty({ example: 'John Doe' })
  nameEn: string;

  @ApiProperty({ example: 'جون دو' })
  nameAr: string;

  @ApiProperty({ example: false })
  isCitizenChild: boolean;

  @ApiProperty({ example: 'Emirati' })
  nationality: string;

  @ApiProperty({ example: 'Male' })
  gender: string;

  @ApiProperty({ example: '784-1995-1234567-1' })
  idNumber: string;

  @ApiProperty({ example: '2030-12-31' })
  expiryDate: string;

  @ApiPropertyOptional({ example: '123456789' })
  unifiedNumber?: string;

  @ApiPropertyOptional({ example: 'FILE-2025-001' })
  fileNumber?: string;

  @ApiProperty({ example: '1995-01-15' })
  dateOfBirth: string;

  @ApiProperty({ example: 'Dubai' })
  placeOfBirth: string;
}

/**
 * Passport DTO for Swagger documentation
 */
export class PassportDto {
  @ApiProperty({ example: 'A1234567' })
  number: string;

  @ApiProperty({ example: 'Ordinary' })
  passportType: string;

  @ApiProperty({ example: 'American' })
  nationality: string;

  @ApiProperty({ example: 'New York' })
  issuePlace: string;

  @ApiProperty({ example: '2020-01-01' })
  issueDate: string;

  @ApiProperty({ example: '2030-01-01' })
  expiryDate: string;

  @ApiProperty({ example: '1995-01-15' })
  dateOfBirth: string;

  @ApiProperty({ example: 'New York' })
  placeOfBirth: string;
}

/**
 * Documents DTO for Swagger documentation
 */
export class DocumentsDto {
  @ApiProperty({ type: FileAttachmentDto })
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  emiratesIdCopy: FileAttachmentDto;

  @ApiPropertyOptional({ type: FileAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  passportCopy?: FileAttachmentDto;

  @ApiProperty({ type: FileAttachmentDto })
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  visaCopy: FileAttachmentDto;

  @ApiPropertyOptional({ type: FileAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  utilityBill?: FileAttachmentDto;

  @ApiPropertyOptional({ type: FileAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  bankStatement?: FileAttachmentDto;

  @ApiPropertyOptional({ type: FileAttachmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileAttachmentDto)
  personalPhoto?: FileAttachmentDto;
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
