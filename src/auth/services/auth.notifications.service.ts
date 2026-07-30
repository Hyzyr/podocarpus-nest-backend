import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AuthNotificationsService {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * Sends notification to admins when a new user registers.
   */
  async notifyNewUser(
    userId: string,
    email: string,
    role: string,
  ): Promise<void> {
    await this.notifications.notifyAdmins({
      title: 'New User Registered',
      message: `A new ${role} user has registered: ${email}`,
      type: NotificationType.user,
      link: `/users/${userId}`,
      priority: 'normal',
      json: { userId, role, email },
    });
  }

  /**
   * Sends a high-priority notification to admins when a user disowns a signup
   * ("this wasn't me" link). The account has been blocked and needs review.
   *
   * Emailed as well as shown in-app: a blocked account means someone may be
   * misusing the platform, and that shouldn't wait for an admin to log in.
   *
   * Flagged as actionable — the account needs deleting or unblocking exactly
   * once, so whichever admin handles it clears the item for the rest. It also
   * never expires: unlike an announcement, an unhandled one must not quietly
   * disappear.
   */
  async notifyDisownedSignup(userId: string, email: string): Promise<void> {
    await this.notifications.notifyAdmins({
      title: 'Signup Disowned — Account Blocked',
      message: `${email} clicked "this wasn't me" on their welcome email. The account has been blocked pending review.`,
      type: NotificationType.user,
      link: `/users/${userId}`,
      priority: 'high',
      email: true,
      requiresAction: true,
      expiresAt: null,
      json: { userId, email, reason: 'disowned_signup' },
    });
  }
}
