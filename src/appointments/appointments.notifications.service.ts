import { Injectable } from '@nestjs/common';
import { PrismaService } from '../_helpers/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CurrentUser } from 'src/_helpers/user.decorator';

@Injectable()
export class AppointmentsNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Handles notifications for appointment status updates.
   */
  async notifyStatusUpdate(
    appointmentId: string,
    oldStatus: string,
    newStatus: string,
    bookedById: string,
    updater: CurrentUser,
  ): Promise<void> {
    const isAdmin = updater.role === 'admin' || updater.role === 'superadmin';

    if (oldStatus !== newStatus) {
      if (isAdmin) {
        // admin updated, notify the investor/broker who booked
        await this.notifications.notify(bookedById, 'appointment', {
          title: 'Appointment Status Updated',
          message: `Your appointment status has been updated to ${newStatus}.`,
          link: `/${appointmentId}`,
          json: { appointmentId, bookedById },
        });
      } else {
        // investor/broker updated, notify admin
        await this.notifications.notifyByRole('admin', 'appointment', {
          title: 'Appointment Status Updated',
          message: `An appointment status has been updated to ${newStatus}.`,
          link: `/${appointmentId}`,
          json: { appointmentId, bookedById },
        });
      }
    } else {
      // general update notification to the booked user
      await this.notifications.notify(bookedById, 'appointment', {
        title: 'Appointment Updated',
        message: `Your appointment has been updated.`,
        link: `/${appointmentId}`,
        json: { appointmentId, bookedById },
      });
    }
  }
}