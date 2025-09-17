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
import { PublicPropertySchema } from 'src/properties/dto';

const propertySelect = zodKeysToSelect(PublicPropertySchema);

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

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

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.ensureExists(id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
      },
    });
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
