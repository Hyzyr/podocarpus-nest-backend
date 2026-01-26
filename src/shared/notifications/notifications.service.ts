import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateNotificationDto,
  CreateNotifyDto,
  NotifyInputDto,
} from './notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { GlobalNotificationsService } from '../global-notifications/global-notifications.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private globalNotifications: GlobalNotificationsService,
  ) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: dto });
  }
  async getRelatedNotifications({ userId, role }: CurrentUser) {
    // Only return user-specific notifications
    // Global notifications are now handled by the GlobalNotification model
    // and queried via /global-notifications endpoint
    return this.prisma.notification.findMany({
      where: {
        userId,
        isGlobal: { not: true }, // Exclude old-style global notifications
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
  async markAllAsRead(user: CurrentUser) {
    // Mark all user-specific notifications as read
    await this.prisma.notification.updateMany({
      where: { userId: user.userId },
      data: { status: 'read', readAt: new Date() },
    });

    // Mark all global notifications as viewed for this user
    await this.globalNotifications.markAllAsViewed(user);

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
