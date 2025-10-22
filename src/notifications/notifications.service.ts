import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import {
  CreateNotificationDto,
  CreateNotifyDto,
  NotifyInputDto,
} from './notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/_helpers/user.decorator';

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
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'read', readAt: new Date() },
    });
    return true;
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
  async notifyByRole(
    userType: UserRole,
    type: NotificationType,
    body: NotifyInputDto,
  ) {
    return this.notifyGroup([userType], type, body);
  }
  async notifyGroup(
    targetRoles: UserRole[],
    type: NotificationType,
    body: NotifyInputDto,
  ) {
    return this.prisma.notification.create({
      data: {
        ...body,
        type,
        targetRoles,
        isGlobal: true,
      },
    });
  }
  async notifyBulk(
    userIdArr: string[],
    type: NotificationType,
    body: NotifyInputDto,
  ) {
    return this.prisma.notification.createMany({
      data: userIdArr.map((userId) => ({ userId, type, ...body })),
    });
  }
}
