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
  ) => {
    if (currentUserId === investorId)
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForAdmin,
        link: `/${contractId}`,
      });
    else
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForInvestor,
        link: `/${contractId}`,
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

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin')
      await this.notifications.notify(investorId, 'contract', {
        ...updateNotificationForAdmin,
        link: `/${contractId}`,
      });
    else
      await this.notifications.notify(investorId, 'contract', {
        ...updateNotificationForInvestor,
        link: `/${contractId}`,
      });
  };
}
