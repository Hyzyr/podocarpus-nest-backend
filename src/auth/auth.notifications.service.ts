import { Injectable } from '@nestjs/common';
import { PrismaService } from '../_helpers/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class AuthNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Sends notification to admins when a new user registers.
   */
  async notifyNewUser(userId: string, email: string, role: string): Promise<void> {
    await this.notifications.notifyByRole('admin', 'user', {
      title: 'New User Registered',
      message: `A new ${role} user has registered: ${email}`,
      link: `/users/${userId}`,
      json: { userId },
    });
  }
}