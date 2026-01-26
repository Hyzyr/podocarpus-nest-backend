import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { 
  KycAutofillDataDto, 
  ContractFormData,
  EmiratesId,
  Passport,
  Documents,
  BuyerDetails,
} from 'src/contracts/dto/contract-form.dto';
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
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
      include: {
        userKycProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    const kycProfile = user.userKycProfile;

    // Parse JSON fields with proper types
    const emiratesId = kycProfile?.emiratesId as EmiratesId | null;
    const passport = kycProfile?.passport as Passport | null;
    const documents = kycProfile?.documents as Documents | null;
    const buyerDetails = kycProfile?.buyerDetails as BuyerDetails | null;

    const autofillData: KycAutofillDataDto = {
      userId: user.id,
      kycProfileId: kycProfile?.id || '',
      
      // Contract Details - always use defaults (varies per contract)
      contractDetails: {
        isLeadGreenList: false,
        buyerType: 'Resident',
        representationType: 'Self',
        preferredLanguage: 'English',
      },
      
      // Buyer Details - from KYC or fallback to AppUser
      buyerDetails: buyerDetails ? {
        isSpecialNeeds: buyerDetails.isSpecialNeeds ?? false,
        currentJob: buyerDetails.currentJob || '',
        country: buyerDetails.country || user.recidence || '',
        city: buyerDetails.city || '',
        cityAr: buyerDetails.cityAr || '',
        street: buyerDetails.street || '',
        streetAr: buyerDetails.streetAr || '',
        address: buyerDetails.address || '',
        phoneDomestic: buyerDetails.phoneDomestic || '',
        mobileDomestic: buyerDetails.mobileDomestic || user.phone || '',
        emailDomestic: buyerDetails.emailDomestic || user.email,
        extCodeDomestic: buyerDetails.extCodeDomestic || '',
        phoneAbroad: buyerDetails.phoneAbroad || '',
        mobileAbroad: buyerDetails.mobileAbroad || '',
        emailAbroad: buyerDetails.emailAbroad || '',
        contactNameEn: buyerDetails.contactNameEn || '',
        contactNameAr: buyerDetails.contactNameAr || '',
        relationType: buyerDetails.relationType || '',
        mobileEmergency: buyerDetails.mobileEmergency || '',
        emailEmergency: buyerDetails.emailEmergency || '',
      } : {
        isSpecialNeeds: false,
        currentJob: '',
        country: user.recidence || '',
        city: '',
        emailDomestic: user.email,
        mobileDomestic: user.phone || '',
        extCodeDomestic: '',
      },
      
      // Emirates ID section - from KYC or fallback to user profile
      emiratesId: {
        nameEn: emiratesId?.nameEn || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        nameAr: emiratesId?.nameAr || '',
        isCitizenChild: emiratesId?.isCitizenChild || false,
        nationality: emiratesId?.nationality || user.nationality || '',
        gender: emiratesId?.gender || '',
        idNumber: emiratesId?.idNumber || '',
        expiryDate: emiratesId?.expiryDate || '',
        unifiedNumber: emiratesId?.unifiedNumber || '',
        fileNumber: emiratesId?.fileNumber || '',
        dateOfBirth: emiratesId?.dateOfBirth || '',
        placeOfBirth: emiratesId?.placeOfBirth || '',
      },
      
      // Passport section - from KYC or fallback to nationality
      passportId: {
        number: passport?.number || '',
        passportType: passport?.passportType || 'Ordinary',
        nationality: passport?.nationality || user.nationality || '',
        issuePlace: passport?.issuePlace || '',
        issueDate: passport?.issueDate || '',
        expiryDate: passport?.expiryDate || '',
        dateOfBirth: passport?.dateOfBirth || '',
        placeOfBirth: passport?.placeOfBirth || '',
      },
      
      // Documents section - from KYC or fallback to profile photo
      // Only include if we have actual document data
      documents: documents ? {
        emiratesIdCopy: documents.emiratesIdCopy,
        passportCopy: documents.passportCopy,
        visaCopy: documents.visaCopy,
        utilityBill: documents.utilityBill,
        bankStatement: documents.bankStatement,
        personalPhoto: documents.personalPhoto || (user.profilePhotoUrl ? {
          name: 'profile-photo',
          url: user.profilePhotoUrl,
          sizeMb: 0,
        } : undefined),
      } : undefined,
    };

    return autofillData;
  }

  /**
   * Update KYC profile from contract form data
   * Only saves identity & verification documents (not contact/address/employment)
   */
  async saveFormDataToKyc(userId: string, formData: ContractFormData) {
    const { emiratesId, passportId, documents, buyerDetails } = formData;

    // Save reusable data for future autofill (excluding contract-specific fields)
    // We use JSON.parse(JSON.stringify()) to ensure class instances are converted to plain objects for Prisma
    const kycData = {
      // Emirates ID - identity document
      emiratesId: emiratesId ? JSON.parse(JSON.stringify(emiratesId)) : undefined,
      
      // Passport - identity document
      passport: passportId ? JSON.parse(JSON.stringify(passportId)) : undefined,
      
      // Documents - verification files (now using FileAttachment structure)
      documents: documents ? JSON.parse(JSON.stringify(documents)) : undefined,
      
      // Buyer Details - reusable contact/address/employment info
      buyerDetails: buyerDetails ? JSON.parse(JSON.stringify(buyerDetails)) : undefined,
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
