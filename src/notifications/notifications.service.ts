import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import { CreateNotificationDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }

  async findUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'read', readAt: new Date() },
    });
  }
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId },
      data: { status: 'read', readAt: new Date() },
    });
  }
}
