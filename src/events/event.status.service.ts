import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import {
  CreateEventStatusDto,
  UpdateUserEventStatusDto,
} from './dto/event.status.dto';

@Injectable()
export class UserEventStatusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventStatusDto) {
    const existing = await this.prisma.userEventStatus.findFirst({
      where: { userId: dto.userId, eventId: dto.eventId },
    });

    if (existing)
      return this.update(existing.id, dto as UpdateUserEventStatusDto);

    return this.prisma.userEventStatus.create({
      data: dto,
    });
  }

  async findAll(userId: string) {
    const event = await this.prisma.userEventStatus.findMany({
      where: { userId },
      include: { event: true },
    });
    if (!event)
      throw new NotFoundException(`event related to user: ${userId} not found`);
    return event;
  }

  async findOne(id: string) {
    const event = await this.prisma.userEventStatus.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException(`event ${id} not found`);
    return event;
  }

  async update(id: string, dto: UpdateUserEventStatusDto) {
    return this.prisma.userEventStatus.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    return this.prisma.userEventStatus.delete({ where: { id } });
  }
}
