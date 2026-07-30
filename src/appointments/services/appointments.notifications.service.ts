import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class AppointmentsNotificationsService {
  constructor(private readonly notifications: NotificationsService) {}

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
    const isStaff = updater.role === 'admin' || updater.role === 'superadmin';
    const json = { appointmentId, bookedById };
    const link = `/${appointmentId}`;

    if (oldStatus === newStatus) {
      // general update notification to the booked user
      await this.notifications.notifyUser(bookedById, {
        title: 'Appointment Updated',
        message: 'Your appointment has been updated.',
        type: NotificationType.appointment,
        link,
        json,
      });
      return;
    }

    if (isStaff) {
      // admin updated, notify the investor/broker who booked
      await this.notifications.notifyUser(bookedById, {
        title: 'Appointment Status Updated',
        message: `Your appointment status has been updated to ${newStatus}.`,
        type: NotificationType.appointment,
        link,
        json,
      });
    } else {
      // investor/broker updated, notify admin
      await this.notifications.notifyAdmins({
        title: 'Appointment Status Updated',
        message: `An appointment status has been updated to ${newStatus}.`,
        type: NotificationType.appointment,
        link,
        json,
      });
    }
  }
}
