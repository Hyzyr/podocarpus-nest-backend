import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  UpdateContractDto,
  CreateContractWithFormDataDto,
  KycAutofillDataDto,
  ContractFormDataSchema,
} from '../dto/contract.dto';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { PropertiesService } from 'src/properties/services/properties.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ContractsNotificationsService } from './contracts.notifications.service';
import { Prisma } from '@prisma/client';
import { ensureNestedBuyer } from '../utils/buyer-transformer.util';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly property: PropertiesService,
    private readonly contractsNotifications: ContractsNotificationsService,
  ) {}

  async createContract(currentUserId: string, dto: CreateContractWithFormDataDto) {
    const propertyId = dto.propertyId;
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property)
      throw new NotFoundException(`Property ${propertyId} not found`);

    // Transform formData if provided (convert flat buyer to nested if needed)
    let normalizedFormData = dto.formData;
    if (dto.formData && dto.formData.buyer) {
      // Auto-detect and convert flat buyer format to nested
      normalizedFormData = {
        ...dto.formData,
        buyer: ensureNestedBuyer(dto.formData.buyer),
      };
    }

    // Validate formData if provided
    if (normalizedFormData) {
      const validation = ContractFormDataSchema.safeParse(normalizedFormData);
      if (!validation.success) {
        throw new Error(
          `Invalid form data: ${validation.error.issues.map((e) => e.message).join(', ')}`,
        );
      }
    }

    const contract = await this.prisma.contract.create({
      data: {
        propertyId: dto.propertyId,
        investorId: dto.investorId,
        brokerId: dto.brokerId,
        contractCode: dto.contractCode,
        contractLink: dto.contractLink,
        filesUrl: dto.filesUrl || [],
        signedDate: dto.signedDate,
        contractStart: dto.contractStart,
        contractEnd: dto.contractEnd,
        contractValue: dto.contractValue,
        depositPaid: dto.depositPaid,
        investorPaymentMethod: dto.investorPaymentMethod,
        paymentSchedule: dto.paymentSchedule,
        vacancyRiskLevel: dto.vacancyRiskLevel,
        status: dto.status || 'pending',
        notes: dto.notes,
        // JSON fields - use normalized formData with nested buyer
        formData: normalizedFormData as Prisma.InputJsonValue,
        terms: dto.terms as Prisma.InputJsonValue,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });

    await this.contractsNotifications.notifyNewContract(
      currentUserId,
      contract.investorId,
      contract.id,
      propertyId,
    );

    return contract;
  }
  async getAll(userId: string) {
    return this.prisma.contract.findMany({
      where: { investorId: userId },
      include: { property: true },
    });
  }

  async findOne(id: string) {
    console.log('Finding contract with id:', id);
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        investor: {
          include: { user: true },
        },
      },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }
  async update(currentUser: CurrentUser, id: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);
    const newContract = await this.prisma.contract.update({
      where: { id },
      data: dto,
    });

    // Handle status changes and notifications
    if (existing.status !== newContract.status) {
      if (newContract.status === 'active') {
        // status changed to active
        await this.property.assignOwner(
          existing.propertyId,
          existing.investorId,
        );
      } else if (newContract.status !== 'suspended') {
        // status changed to something else than active and suspended
        await this.property.assignOwner(existing.propertyId, null);
      }

      await this.contractsNotifications.notifyStatusChange(
        currentUser,
        existing.id,
        existing.propertyId,
        existing.investorId,
        newContract.status,
      );
    }

    return newContract;
  }

  ///
  ///
  // Admin only
  async findAll() {
    return this.prisma.contract.findMany({
      include: {
        property: true,
        investor: {
          include: { user: true },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    return this.prisma.contract.delete({ where: { id } });
  }

  // ============================================================================
  // KYC AUTOFILL METHODS
  // ============================================================================

  /**
   * Get KYC data for autofilling contract forms
   * @param userId - The user ID to fetch KYC data for
   * @returns KYC profile data formatted for contract form autofill
   */
  async getKycAutofillData(userId: string): Promise<KycAutofillDataDto | null> {
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
      emiratesId: kycProfile.emiratesId as any,
      passport: kycProfile.passport as any,
      workInfo: kycProfile.workInfo as any,
      contactInfo: kycProfile.contactInfo as any,
      address: kycProfile.address as any,
      emergencyContact: kycProfile.emergencyContact as any,
      documents: kycProfile.documents as any,
    };

    return autofillData;
  }


  /**
   * Update KYC profile from contract form data
   * Allows saving contract form data back to user's KYC profile for future autofill
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
