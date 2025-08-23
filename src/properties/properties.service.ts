import { Injectable, NotFoundException } from '@nestjs/common';
import { Property } from '@prisma/client';
import { PrismaService } from '../_helpers/database/prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.property.create({ data });
  }

  async findAll() {
    return this.prisma.property.findMany();
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }

  async update(id: string, data: Partial<Property>) {
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.property.delete({ where: { id } });
  }
}
