import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { GlobalNotificationsService } from 'src/shared/global-notifications/global-notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class PropertiesNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly globalNotifications: GlobalNotificationsService,
  ) {}

  /**
   * Handles notifications when a property owner changes.
   * Cancels all appointments and notifies participants.
   */
  async handleOwnerChange(propertyId: string): Promise<void> {
    // get all appointments for this property
    const appointments = await this.prisma.appointment.findMany({
      where: { propertyId },
      select: { id: true, bookedById: true },
    });

    // cancel all appointments
    await this.prisma.appointment.updateMany({
      where: { propertyId },
      data: { status: 'canceled' },
    });

    // bulk create notifications
    const notifications = appointments.map(appointment => ({
      userId: appointment.bookedById,
      body: {
        title: 'Appointment Canceled',
        message: `Your appointment for this property has been canceled due to ownership change.`,
        link: `/${appointment.id}`,
        json: { appointmentId: appointment.id, bookedById: appointment.bookedById },
      },
    }));

    await this.notifications.notifyBulkCustom(notifications, 'appointment');
  }

  /**
   * Sends notification for new property creation.
   */
  async notifyNewProperty(propertyId: string, title: string): Promise<void> {
    await this.globalNotifications.create({
      title: 'New Property Available',
      message: `**${title}** is now open for investment.`,
      type: NotificationType.property,
      targetRoles: [UserRole.broker, UserRole.investor],
      link: `/properties/${propertyId}`,
      priority: 'normal',
      json: { propertyId },
    });
  }
}