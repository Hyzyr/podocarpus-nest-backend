import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import {
  ContractDto,
  CreateContractDto,
  UpdateContractDto,
} from './dto/contract.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  notificationForAdmin,
  notificationForInvestor,
  updateNotificationForAdmin,
  updateNotificationForInvestor,
} from './contract.config';
import { PropertiesService } from 'src/properties/properties.service';
import { CurrentUser } from 'src/_helpers/user.decorator';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly property: PropertiesService,
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
    await this.newContractNotify(
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
      include: { property: true, investor: true },
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

    await this.statusChangeHandle(currentUser, existing, newContract);

    return newContract;
  }

  ///
  ///
  // Admin only
  async findAll() {
    return this.prisma.contract.findMany({
      include: { property: true, investor: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    return this.prisma.contract.delete({ where: { id } });
  }

  // in service functionality
  private newContractNotify = async (
    currentUserId: string,
    investorId: string,
    contractId: string,
    propertyId: string,
  ) => {
    // structured ids included in json payload so admin UI can build the correct route
    const jsonPayload = { investorId, propertyId, contractId };

    if (currentUserId === investorId)
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForAdmin,
        link: `/${investorId}`,
        json: jsonPayload,
      });
    else
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForInvestor,
        link: `/${investorId}`,
        json: jsonPayload,
      });
  };

  private statusChangeHandle = async (
    currentUser: CurrentUser,
    existingContract: ContractDto,
    newContract: ContractDto,
  ) => {
    const existing = existingContract;
    if (existing.status === newContract.status) return;

    const { id: contractId, propertyId, investorId } = existing;
    if (newContract.status === 'active') {
      // status changed to active
      await this.property.assignOwner(propertyId, investorId);
    } else if (newContract.status !== 'suspended') {
      // status changed to something else than active and suspended
      await this.property.assignOwner(propertyId, null);
    }

    const jsonPayload = { investorId, propertyId, contractId };
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

    if (isAdmin) {
      // admin updated, notify investor
      await this.notifications.notify(investorId, 'contract', {
        ...updateNotificationForInvestor,
        link: `/${contractId}`,
        json: jsonPayload,
      });
    } else {
      // investor/broker updated, notify admin
      await this.notifications.notifyByRole('admin', 'contract', {
        ...updateNotificationForAdmin,
        link: `/${contractId}`,
        json: jsonPayload,
      });
    }
  };
}
