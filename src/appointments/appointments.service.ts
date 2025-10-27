import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/_helpers/database/prisma/prisma.service';
import {
  CreateAppointmentDto,
  createAppointmentSchema,
  UpdateAppointmentDto,
} from './dto';
import { UserActionsStatus } from '@prisma/client';
import { CurrentUser } from 'src/_helpers/user.decorator';
import { zodKeysToSelect } from 'src/utils/zod-helpers';
import { PublicPropertySchema } from 'src/properties/dto/property.get.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

const propertySelect = zodKeysToSelect(PublicPropertySchema);

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: CurrentUser, dto: CreateAppointmentDto) {
    const userId = user?.userId;
    const existing = await this.prisma.appointment.findFirst({
      where: {
        bookedById: userId,
        propertyId: dto.propertyId,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an appointment for this property',
      );
    }
    const data = createAppointmentSchema.parse({
      propertyId: dto.propertyId,
      bookedById: userId, // enforce current user
      // slotId: dto.slotId ?? null,
      status: dto.status ?? UserActionsStatus.requested,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
    });
    return this.prisma.appointment.create({ data });
  }

  async findAllForUser(userId: string) {
    return this.prisma.appointment.findMany({
      where: { bookedById: userId },
      include: {
        property: { select: propertySelect },
        // slot: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findAllForProperty(propertyId: string) {
    return this.prisma.appointment.findMany({
      where: { propertyId },
      include: {
        property: { select: propertySelect },
        bookedBy: true,
        // slot: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        property: { select: propertySelect },
        bookedBy: true,
        // slot: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, user: CurrentUser) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      select: { bookedById: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    // notify based on status change and updater role
    if (existing.status !== updated.status) {
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      const bookedById = existing.bookedById;

      if (isAdmin) {
        // admin updated, notify the investor/broker who booked
        await this.notifications.notify(bookedById, 'appointment', {
          title: 'Appointment Status Updated',
          message: `Your appointment status has been updated to ${updated.status}.`,
          link: `/${id}`,
          json: { appointmentId: id, bookedById },
        });
      } else {
        // investor/broker updated, notify admin
        await this.notifications.notifyByRole('admin', 'appointment', {
          title: 'Appointment Status Updated',
          message: `An appointment status has been updated to ${updated.status}.`,
          link: `/${id}`,
          json: { appointmentId: id, bookedById },
        });
      }
    } else {
      // general update notification to the booked user
      await this.notifications.notify(existing.bookedById, 'appointment', {
        title: 'Appointment Updated',
        message: `Your appointment has been updated.`,
        link: `/${id}`,
        json: {
          appointmentId: id,
          bookedById: existing.bookedById
        }
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }
  }
}
