import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  ContractDto,
  CreateContractDto,
  UpdateContractDto,
} from '../dto/contract.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  notificationForAdmin,
  notificationForInvestor,
  updateNotificationForAdmin,
  updateNotificationForInvestor,
} from '../contract.config';
import { PropertiesService } from 'src/properties/services/properties.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ContractsNotificationsService } from './contracts.notifications.service';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly property: PropertiesService,
    private readonly contractsNotifications: ContractsNotificationsService,
  ) {}

  async createContract(currentUserId: string, dto: CreateContractDto) {
    const propertyId = dto.propertyId;
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property)
      throw new NotFoundException(`Property ${propertyId} not found`);
    const contract = await this.prisma.contract.create({
      data: { ...dto },
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
}
