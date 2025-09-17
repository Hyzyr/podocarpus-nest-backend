import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto, EventDto, UpdateEventDto } from './dto';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventDto) {
    console.log(' >>>> create');
    return this.prisma.event.create({
      data: dto,
    });
  }

  async findAll(userId: string) {
    console.log(' >>>> findAll');

    return this.prisma.event.findMany({
      include: {
        userStatuses: {
          where: { userId }, // only fetch status for this user
        },
      },
    });
  }

  async findOne(id: string) {
    console.log(' >>>> findOne');

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`event ${id} not found`);
    return event;
  }
  async update(id: string, dto: UpdateEventDto) {
    console.log(' >>>> update');

    return this.prisma.event.update({
      where: { id },
      data: dto,
    });
  }
  async remove(id: string) {
    console.log(' >>>> remove');

    return this.prisma.event.delete({ where: { id } });
  }
}
