import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateNotificationDto,
  CreateNotifyDto,
  NotifyInputDto,
} from './notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }
  async getRelatedNotifications({ userId, role }: CurrentUser) {
    return this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { isGlobal: true, targetRoles: { has: role } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async markAsRead(id: string, userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'read', readAt: new Date() },
    });

    return updated.count > 0;
  }
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId },
      data: { status: 'read', readAt: new Date() },
    });
    return true;
  }

  ///
  ///
  // in app functionality
  async notify(userId: string, type: NotificationType, body: NotifyInputDto) {
    const data: CreateNotifyDto = { userId, type, ...body };
    return this.create(data);
  }

  // Bulk notifications for specific users
  async notifyBulk(
    userIdArr: string[],
    type: NotificationType,
    body: NotifyInputDto,
  ) {
    return this.prisma.notification.createMany({
      data: userIdArr.map((userId) => ({ userId, type, ...body })),
    });
  }
  async notifyBulkCustom(
    notifications: Array<{ userId: string; body: NotifyInputDto }>,
    type: NotificationType,
  ) {
    return this.prisma.notification.createMany({
      data: notifications.map(({ userId, body }) => ({
        userId,
        type,
        ...body,
      })),
    });
  }
}
