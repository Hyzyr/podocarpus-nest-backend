import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { GlobalNotificationsService } from 'src/shared/global-notifications/global-notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class EventsNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalNotifications: GlobalNotificationsService,
  ) {}

  /**
   * Sends notification for new event creation.
   */
  async notifyNewEvent(eventId: string, title: string, description: string): Promise<void> {
    await this.globalNotifications.create({
      title: `New Event: ${title}`,
      message: description,
      type: NotificationType.event,
      targetRoles: [UserRole.investor, UserRole.broker],
      link: `/events/${eventId}`,
      priority: 'normal',
      json: { eventId },
    });
  }

  /**
   * Sends notification for event status updates.
   */
  async notifyStatusUpdate(eventId: string, title: string, newStatus: string): Promise<void> {
    await this.globalNotifications.create({
      title: `Event Status Updated: ${title}`,
      message: `The event status has changed to ${newStatus}.`,
      type: NotificationType.event,
      targetRoles: [UserRole.investor, UserRole.broker],
      link: `/events/${eventId}`,
      priority: 'normal',
      json: { eventId, newStatus },
    });
  }
}