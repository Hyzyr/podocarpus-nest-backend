import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateAppointmentDto,
  createAppointmentSchema,
  UpdateAppointmentDto,
} from '../dto/appointments.dto';
import { UserActionsStatus } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { zodKeysToSelect } from 'src/common/utils/zod-helpers';
import { PublicPropertySchema } from 'src/properties/dto/property.get.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AppointmentsNotificationsService } from './appointments.notifications.service';

const propertySelect = zodKeysToSelect(PublicPropertySchema);

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly appointmentsNotifications: AppointmentsNotificationsService,
  ) {}

  async create(user: CurrentUser, dto: CreateAppointmentDto) {
    const userId = user?.userId;
    const existing = await this.prisma.appointment.findFirst({
      where: {
        bookedById: userId,
        propertyId: dto.propertyId,
        status: 'requested',
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

  // ==================== Admin Methods ====================

  /**
   * Get all appointments (Admin only)
   * Includes property details and booked user info
   */
  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        property: { select: propertySelect },
        bookedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  /**
   * Get appointments with filters (Admin only)
   * @param status - Filter by appointment status
   * @param propertyId - Filter by property
   * @param userId - Filter by user
   */
  async findAllWithFilters(filters?: {
    status?: UserActionsStatus;
    propertyId?: string;
    userId?: string;
  }) {
    return this.prisma.appointment.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.propertyId && { propertyId: filters.propertyId }),
        ...(filters?.userId && { bookedById: filters.userId }),
      },
      include: {
        property: { select: propertySelect },
        bookedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  /**
   * Get appointment statistics (Admin only)
   */
  async getStatistics() {
    const [total, byStatus, byProperty] = await Promise.all([
      // Total count
      this.prisma.appointment.count(),

      // Count by status
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Top 5 properties by appointment count
      this.prisma.appointment.groupBy({
        by: ['propertyId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      topProperties: byProperty.map((p) => ({
        propertyId: p.propertyId,
        count: p._count.id,
      })),
    };
  }

  // ==================== End Admin Methods ====================

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
      await this.appointmentsNotifications.notifyStatusUpdate(
        id,
        existing.status,
        updated.status,
        existing.bookedById,
        user,
      );
    } else {
      // general update notification to the booked user
      await this.notifications.notify(existing.bookedById, 'appointment', {
        title: 'Appointment Updated',
        message: `Your appointment has been updated.`,
        link: `/${id}`,
        json: {
          appointmentId: id,
          bookedById: existing.bookedById,
        },
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
