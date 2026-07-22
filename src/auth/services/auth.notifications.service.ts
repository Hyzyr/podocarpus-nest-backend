import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { GlobalNotificationsService } from 'src/shared/global-notifications/global-notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class AuthNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalNotifications: GlobalNotificationsService,
  ) {}

  /**
   * Sends notification to admins when a new user registers.
   */
  async notifyNewUser(userId: string, email: string, role: string): Promise<void> {
    await this.globalNotifications.create({
      title: 'New User Registered',
      message: `A new ${role} user has registered: ${email}`,
      type: NotificationType.user,
      targetRoles: [UserRole.admin, UserRole.superadmin],
      link: `/users/${userId}`,
      priority: 'normal',
      json: { userId, role, email },
    });
  }

  /**
   * Sends a high-priority notification to admins when a user disowns a signup
   * ("this wasn't me" link). The account has been blocked and needs review.
   */
  async notifyDisownedSignup(userId: string, email: string): Promise<void> {
    await this.globalNotifications.create({
      title: 'Signup Disowned — Account Blocked',
      message: `${email} clicked "this wasn't me" on their welcome email. The account has been blocked pending review.`,
      type: NotificationType.user,
      targetRoles: [UserRole.admin, UserRole.superadmin],
      link: `/users/${userId}`,
      priority: 'high',
      json: { userId, email, reason: 'disowned_signup' },
    });
  }
}