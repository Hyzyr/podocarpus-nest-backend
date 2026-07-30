import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class PropertiesNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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

    // one notification per affected booking, each deep-linking to its own appointment
    await this.notifications.notifyEach(
      appointments.map((appointment) => ({
        userId: appointment.bookedById,
        content: {
          title: 'Appointment Canceled',
          message:
            'Your appointment for this property has been canceled due to ownership change.',
          link: `/${appointment.id}`,
          json: {
            appointmentId: appointment.id,
            bookedById: appointment.bookedById,
          },
        },
      })),
      NotificationType.appointment,
    );
  }

  /**
   * Sends notification for new property creation.
   */
  async notifyNewProperty(propertyId: string, title: string): Promise<void> {
    await this.notifications.notifyRoles(
      [UserRole.broker, UserRole.investor],
      {
        title: 'New Property Available',
        message: `**${title}** is now open for investment.`,
        type: NotificationType.property,
        link: `/properties/${propertyId}`,
        priority: 'normal',
        json: { propertyId },
      },
    );
  }
}
