import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

/** Events are announced to the people who can attend them. */
const EVENT_AUDIENCE = [UserRole.investor, UserRole.broker];

@Injectable()
export class EventsNotificationsService {
  constructor(private readonly notifications: NotificationsService) {}

  /**
   * Sends notification for new event creation.
   */
  async notifyNewEvent(
    eventId: string,
    title: string,
    description: string,
  ): Promise<void> {
    await this.notifications.notifyRoles(EVENT_AUDIENCE, {
      title: `New Event: ${title}`,
      message: description,
      type: NotificationType.event,
      link: `/events/${eventId}`,
      priority: 'normal',
      json: { eventId },
    });
  }

  /**
   * Sends notification for event status updates.
   */
  async notifyStatusUpdate(
    eventId: string,
    title: string,
    newStatus: string,
  ): Promise<void> {
    await this.notifications.notifyRoles(EVENT_AUDIENCE, {
      title: `Event Status Updated: ${title}`,
      message: `The event status has changed to ${newStatus}.`,
      type: NotificationType.event,
      link: `/events/${eventId}`,
      priority: 'normal',
      json: { eventId, newStatus },
    });
  }
}
