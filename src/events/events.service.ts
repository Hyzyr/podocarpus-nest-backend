import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto, EventDto, UpdateEventDto } from './dto';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventDto) {

    return this.prisma.event.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.event.findMany({});
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`event ${id} not found`);
    return event;
  }
  async update(id: string, dto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: dto,
    });
  }
  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
