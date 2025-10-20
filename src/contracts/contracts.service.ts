import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationsService,
  ) {}

  async createContract(dto: CreateContractDto) {
    const propertyId = dto.propertyId;
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property)
      throw new NotFoundException(`Property ${propertyId} not found`);

    return this.prisma.contract.create({
      data: { ...dto },
    });
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
  async update(id: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    // when status changed
    if (existing.status !== dto.status) {
      if (dto.status === 'active') {
        await this.prisma.property.update({
          where: { id: dto.propertyId },
          data: { ownerId: dto.investorId },
        });
      } else if (dto.status !== 'suspended') {
        await this.prisma.property.update({
          where: { id: dto.propertyId, ownerId: dto.investorId },
          data: { ownerId: null },
        });
      }
    }

    return this.prisma.contract.update({
      where: { id },
      data: dto,
    });
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
}
