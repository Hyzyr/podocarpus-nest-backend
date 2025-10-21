import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: dto,
    });
    await this.notifications.notifyGroup(['investor', 'broker'], 'event', {
      title: `New Event: ${dto.title}`,
      message: `${event.description}`,
      link: `/${event.id}`,
    });
    return event;
  }

  async findAll(userId: string) {
    return this.prisma.event.findMany({
      include: {
        userStatuses: {
          where: { userId }, // only fetch status for this user
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`event ${id} not found`);
    return event;
  }

  async findOneFullInfo(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        userStatuses: { include: { user: true } },
      },
    });
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
