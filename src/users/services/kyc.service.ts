import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { KycAutofillDataDto, ContractFormData } from 'src/contracts/dto/contract-form.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve KYC profile data for autofilling contract forms
   * Maps UserKycProfile fields to the new ContractFormData structure
   */
  async getKycAutofillData(
    userId: string,
  ): Promise<KycAutofillDataDto | null> {
    const kycProfile = await this.prisma.userKycProfile.findUnique({
      where: { userId },
    });

    if (!kycProfile) {
      return null;
    }

    // Map KYC identity data to contract form structure
    const emiratesId = kycProfile.emiratesId as any;
    const passport = kycProfile.passport as any;
    const documents = kycProfile.documents as any;

    const autofillData: KycAutofillDataDto = {
      userId: kycProfile.userId,
      kycProfileId: kycProfile.id,
      
      // Contract Details - buyerType not stored in KYC (contract-specific)
      contractDetails: undefined,
      
      // Buyer Details - will be filled manually (not stored in KYC)
      buyerDetails: undefined,
      
      // Emirates ID section - from KYC
      emiratesId: emiratesId ? {
        nameEn: emiratesId.nameEn,
        nameAr: emiratesId.nameAr,
        isCitizenChild: emiratesId.isCitizenChild,
        nationality: emiratesId.nationality,
        gender: emiratesId.gender,
        idNumber: emiratesId.idNumber,
        expiryDate: emiratesId.expiryDate,
        unifiedNumber: emiratesId.unifiedNumber,
        fileNumber: emiratesId.fileNumber,
        dateOfBirth: emiratesId.dateOfBirth,
        placeOfBirth: emiratesId.placeOfBirth,
      } : undefined,
      
      // Passport section - from KYC
      passportId: passport ? {
        number: passport.number,
        passportType: passport.passportType,
        nationality: passport.nationality,
        issuePlace: passport.issuePlace,
        issueDate: passport.issueDate,
        expiryDate: passport.expiryDate,
        dateOfBirth: passport.dateOfBirth,
        placeOfBirth: passport.placeOfBirth,
      } : undefined,
      
      // Documents section - from KYC
      documents: documents ? {
        emiratesIdCopy: documents.emiratesIdCopy,
        passportCopy: documents.passportCopy,
        visaCopy: documents.visaCopy,
        utilityBill: documents.utilityBill,
        bankStatement: documents.bankStatement,
        personalPhoto: documents.personalPhoto,
      } : undefined,
    };

    return autofillData;
  }

  /**
   * Update KYC profile from contract form data
   * Only saves identity & verification documents (not contact/address/employment)
   */
  async saveFormDataToKyc(userId: string, formData: ContractFormData) {
    const { emiratesId, passportId, documents } = formData;

    // Only save KYC-relevant identity & verification data (no contract-specific fields)
    const kycData = {
      // Emirates ID - identity document
      emiratesId: emiratesId ? (emiratesId as Prisma.InputJsonValue) : Prisma.JsonNull,
      
      // Passport - identity document
      passport: passportId ? (passportId as Prisma.InputJsonValue) : Prisma.JsonNull,
      
      // Documents - verification files
      documents: documents ? (documents as Prisma.InputJsonValue) : Prisma.JsonNull,
    };

    const kycProfile = await this.prisma.userKycProfile.upsert({
      where: { userId },
      update: kycData,
      create: {
        userId,
        ...kycData,
      },
    });

    return kycProfile;
  }
}
