import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll() {
    return this.prisma.contract.findMany({
      include: { property: true, investor: true },
    });
  }

  // 🔹 Get single contract
  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { property: true, investor: true },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }

  // 🔹 Update
  async update(id: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    return this.prisma.contract.update({
      where: { id },
      data: dto,
    });
  }

  // 🔹 Delete
  async remove(id: string) {
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Contract ${id} not found`);

    return this.prisma.contract.delete({ where: { id } });
  }
}
