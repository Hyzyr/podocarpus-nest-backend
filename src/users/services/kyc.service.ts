import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { KycAutofillDataDto } from 'src/contracts/dto/contract.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve KYC profile data for autofilling contract forms
   * Returns all KYC fields (personal info, IDs, documents, etc.)
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

    // Transform Prisma JSON fields to typed objects
    const autofillData: KycAutofillDataDto = {
      userId: kycProfile.userId,
      kycProfileId: kycProfile.id,
      buyerType: kycProfile.buyerType || undefined,
      emiratesId: (kycProfile.emiratesId as any) || undefined,
      passport: (kycProfile.passport as any) || undefined,
      workInfo: (kycProfile.workInfo as any) || undefined,
      contactInfo: (kycProfile.contactInfo as any) || undefined,
      address: (kycProfile.address as any) || undefined,
      emergencyContact: (kycProfile.emergencyContact as any) || undefined,
      documents: (kycProfile.documents as any) || undefined,
    };

    return autofillData;
  }

  /**
   * Update KYC profile from contract form data
   * Allows saving contract form data back to user's KYC profile for future autofill
   * Supports both individual and company buyer data
   */
  async saveFormDataToKyc(userId: string, formData: any) {
    const buyer = formData.buyer;
    if (!buyer) {
      throw new Error('No buyer data provided in form data');
    }

    const kycData = {
      buyerType: buyer.buyerType || null,
      emiratesId: buyer.emiratesId || Prisma.JsonNull,
      passport: buyer.passport || Prisma.JsonNull,
      workInfo: buyer.workInfo || Prisma.JsonNull,
      contactInfo: buyer.contactInfo || Prisma.JsonNull,
      address: buyer.address || Prisma.JsonNull,
      emergencyContact: buyer.emergencyContact || Prisma.JsonNull,
      documents: Prisma.JsonNull,
    };

    const kycProfile = await this.prisma.userKycProfile.upsert({
      where: { userId },
      update: kycData,
      create: {
        userId,
        buyerType: kycData.buyerType,
        emiratesId: kycData.emiratesId,
        passport: kycData.passport,
        workInfo: kycData.workInfo,
        contactInfo: kycData.contactInfo,
        address: kycData.address,
        emergencyContact: kycData.emergencyContact,
        documents: kycData.documents,
      },
    });

    return kycProfile;
  }
}
