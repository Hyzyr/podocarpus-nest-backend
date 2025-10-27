import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../_helpers/database/prisma/prisma.service';
import { CreatePropertyDto } from './dto/property.create.dto';
import { UpdatePropertyDto } from './dto/property.update.dto';
import { FindAllPropertiesQueryDto } from './dto/property.query.dto';
import {
  PublicPropertySchema,
  PublicPropertyWithRelationsSchema,
} from './dto/property.get.dto';
import { publicUserSelect } from 'src/users/dto/user.get.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll() {
    const data = await this.prisma.property.findMany({
      where: { ownerId: null },
    });
    return PublicPropertySchema.array().parse(data);
  }
  async search(query?: FindAllPropertiesQueryDto) {
    const {
      search,
      city,
      country,
      area,
      status,
      developer,
      buildingName,
      minRent,
      maxRent,
      minSize,
      maxSize,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdFrom,
      createdTo,
    } = query || {};

    const data = await this.prisma.property.findMany({
      where: {
        AND: [
          { ownerId: null },
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                  { area: { contains: search, mode: 'insensitive' } },
                  { buildingName: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          city ? { city: { equals: city, mode: 'insensitive' } } : {},
          country ? { country: { equals: country, mode: 'insensitive' } } : {},
          area ? { area: { equals: area, mode: 'insensitive' } } : {},
          status ? { status: { equals: status, mode: 'insensitive' } } : {},
          developer
            ? { developer: { equals: developer, mode: 'insensitive' } }
            : {},
          buildingName
            ? { buildingName: { equals: buildingName, mode: 'insensitive' } }
            : {},
          minRent ? { rentValue: { gte: minRent } } : {},
          maxRent ? { rentValue: { lte: maxRent } } : {},
          minSize ? { unitTotalSize: { gte: minSize } } : {},
          maxSize ? { unitTotalSize: { lte: maxSize } } : {},
          isActive !== undefined ? { isActive } : {},
          createdFrom ? { createdAt: { gte: new Date(createdFrom) } } : {},
          createdTo ? { createdAt: { lte: new Date(createdTo) } } : {},
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return PublicPropertySchema.array().parse(data);
  }
  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        appointments: { where: { bookedById: id } },
      },
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return PublicPropertyWithRelationsSchema.parse(property);
  }

  ///
  ///
  ///
  // admin only props and
  // these are not parsed to Public
  async getAll() {
    const data = await this.prisma.property.findMany({
      include: { contracts: true },
    });

    return data;
  }
  async findOneFullInfo(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: { include: { user: { select: publicUserSelect } } },
        appointments: {
          include: {
            bookedBy: { select: publicUserSelect },
          },
        },
      },
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }
  async create(dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: dto,
    });

    if (dto.status !== 'draft')
      await this.notifications.notifyGroup(['broker', 'investor'], 'property', {
        title: `New Property`,
        message: `**${property.title}** is now open for investment.`,
        link: `/${property.id}`,
        json: { propertyId: property.id },
      });
    return property;
  }
  async update(id: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.update({
      where: { id },
      data: dto,
    });
    return property;
  }
  async remove(id: string) {
    return this.prisma.property.delete({ where: { id } });
  }

  ///
  ///
  ///
  // in app functionality
  async assignOwner(propertyId: string, investorId: string | null) {
    const existingProperty = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    if (!existingProperty) throw new NotFoundException(`Property ${propertyId} not found`);

    // if owner changed, handle cancellation and notifications
    if (existingProperty.ownerId !== investorId) {
      await this.handleOwnerChange(propertyId);
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { ownerId: investorId },
    });
  }
  private async handleOwnerChange(propertyId: string) {
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
}
