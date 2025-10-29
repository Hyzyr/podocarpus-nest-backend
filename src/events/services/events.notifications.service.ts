import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class EventsNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Sends notification for new event creation.
   */
  async notifyNewEvent(eventId: string, title: string, description: string): Promise<void> {
    await this.notifications.notifyGroup(['investor', 'broker'], 'event', {
      title: `New Event: ${title}`,
      message: description,
      link: `/${eventId}`,
      json: { eventId },
    });
  }

  /**
   * Sends notification for event status updates.
   */
  async notifyStatusUpdate(eventId: string, title: string, newStatus: string): Promise<void> {
    await this.notifications.notifyGroup(['investor', 'broker'], 'event', {
      title: `Event Status Updated: ${title}`,
      message: `The event status has changed to ${newStatus}.`,
      link: `/${eventId}`,
      json: { eventId },
    });
  }
}