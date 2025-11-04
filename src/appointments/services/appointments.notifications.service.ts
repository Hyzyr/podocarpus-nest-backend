import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GlobalNotificationsService } from 'src/global-notifications/global-notifications.service';
import { NotificationType, UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class AppointmentsNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly globalNotifications: GlobalNotificationsService,
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
        await this.globalNotifications.create({
          title: 'Appointment Status Updated',
          message: `An appointment status has been updated to ${newStatus}.`,
          type: NotificationType.appointment,
          targetRoles: [UserRole.admin, UserRole.superadmin],
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