import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  UpdateContractDto,
  CreateContractWithFormDataDto,
} from '../dto/contract.dto';
import { ContractFormDataSchema } from '../dto/contract-form.dto';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { PropertiesService } from 'src/properties/services/properties.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ContractsNotificationsService } from './contracts.notifications.service';
import { Prisma } from '@prisma/client';

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

    // Validate formData if provided using the new structure
    if (dto.formData) {
      const validation = ContractFormDataSchema.safeParse(dto.formData);
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
        // JSON fields - store the new clean structure
        formData: dto.formData as Prisma.InputJsonValue,
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
    } else {
      // If status didn't change but other fields did, send general update notification
      // Only notify if updates are done by someone other than the investor
      if (currentUser.id !== existing.investorId) {
        await this.contractsNotifications.notifyGeneralUpdate(
          currentUser,
          existing.id,
          existing.propertyId,
          existing.investorId,
        );
      }
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

  async remove(currentUser: CurrentUser, id: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    // Send notification before deleting
    await this.contractsNotifications.notifyDeletion(
      currentUser,
      existing.id,
      existing.propertyId,
      existing.investorId,
    );

    return this.prisma.contract.delete({ where: { id } });
  }

  // ============================================================================
  // END OF CONTRACTS SERVICE
  // ============================================================================
}
