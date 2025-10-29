 import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateTenantLeaseDto,
  UpdateTenantLeaseDto,
} from '../dto/tenant-lease.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class TenantLeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Create a new tenant lease
   * Automatically updates property vacancy status
   */
  async create(dto: CreateTenantLeaseDto) {
    // Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: true },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found`);
    }

    // Check for overlapping active leases
    const overlappingLease = await this.prisma.tenantLease.findFirst({
      where: {
        propertyId: dto.propertyId,
        isActive: true,
        OR: [
          {
            leaseStart: { lte: dto.leaseStart },
            leaseEnd: dto.leaseEnd ? { gte: dto.leaseStart } : undefined,
          },
          {
            leaseStart: dto.leaseEnd ? { lte: dto.leaseEnd } : undefined,
            leaseEnd: dto.leaseEnd ? { gte: dto.leaseEnd } : undefined,
          },
        ],
      },
    });

    if (overlappingLease) {
      throw new BadRequestException(
        'There is already an active lease for this property during the specified period',
      );
    }

    // Create the lease
    const lease = await this.prisma.tenantLease.create({
      data: {
        ...dto,
        isActive: dto.isActive ?? true,
      },
    });

    // Update property vacancy status if lease is active
    if (lease.isActive) {
      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { isVacant: false },
      });
    }

    // Send notification to property owner if exists
    if (property.ownerId) {
      await this.notifications.create({
        userId: property.ownerId,
        type: NotificationType.property,
        title: 'New Tenant Lease Created',
        message: `A new tenant lease has been created for your property "${property.title}"`,
        link: `/properties/${property.id}`,
        targetRoles: [UserRole.investor],
      });
    }

    return lease;
  }

  /**
   * Get all tenant leases for a property
   */
  async findByProperty(propertyId: string) {
    return this.prisma.tenantLease.findMany({
      where: { propertyId },
      orderBy: { leaseStart: 'desc' },
    });
  }

  /**
   * Get a single tenant lease
   */
  async findOne(id: string) {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            buildingName: true,
            unitNo: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException(`Tenant lease with ID ${id} not found`);
    }

    return lease;
  }

  /**
   * Get all active tenant leases
   */
  async findAllActive() {
    return this.prisma.tenantLease.findMany({
      where: { isActive: true },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            buildingName: true,
            unitNo: true,
          },
        },
      },
      orderBy: { leaseStart: 'desc' },
    });
  }

  /**
   * Update a tenant lease
   */
  async update(id: string, dto: UpdateTenantLeaseDto) {
    const existingLease = await this.prisma.tenantLease.findUnique({
      where: { id },
      include: { property: { include: { owner: true } } },
    });

    if (!existingLease) {
      throw new NotFoundException(`Tenant lease with ID ${id} not found`);
    }

    // Check for overlapping leases if dates are being updated
    if (dto.leaseStart || dto.leaseEnd) {
      const overlappingLease = await this.prisma.tenantLease.findFirst({
        where: {
          id: { not: id },
          propertyId: existingLease.propertyId,
          isActive: true,
          OR: [
            {
              leaseStart: { lte: dto.leaseStart || existingLease.leaseStart },
              leaseEnd: {
                gte: dto.leaseStart || existingLease.leaseStart,
              },
            },
          ],
        },
      });

      if (overlappingLease) {
        throw new BadRequestException(
          'The updated dates would overlap with an existing active lease',
        );
      }
    }

    const updatedLease = await this.prisma.tenantLease.update({
      where: { id },
      data: dto,
    });

    // Update property vacancy status if lease active status changed
    if (dto.isActive !== undefined && dto.isActive !== existingLease.isActive) {
      await this.updatePropertyVacancyStatus(existingLease.propertyId);

      // Notify owner if lease became inactive
      if (!dto.isActive && existingLease.property.ownerId) {
        await this.notifications.create({
          userId: existingLease.property.ownerId,
          type: NotificationType.property,
          title: 'Tenant Lease Ended',
          message: `The tenant lease for "${existingLease.property.title}" has been marked as inactive`,
          link: `/properties/${existingLease.propertyId}`,
          targetRoles: [UserRole.investor],
        });
      }
    }

    return updatedLease;
  }

  /**
   * Terminate a lease early
   */
  async terminate(id: string, reason: string) {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id },
      include: { property: { include: { owner: true } } },
    });

    if (!lease) {
      throw new NotFoundException(`Tenant lease with ID ${id} not found`);
    }

    const terminatedLease = await this.prisma.tenantLease.update({
      where: { id },
      data: {
        isActive: false,
        terminatedEarly: true,
        terminationReason: reason,
        leaseEnd: new Date(),
      },
    });

    // Update property vacancy
    await this.updatePropertyVacancyStatus(lease.propertyId);

    // Notify owner
    if (lease.property.ownerId) {
      await this.notifications.create({
        userId: lease.property.ownerId,
        type: NotificationType.property,
        title: 'Lease Terminated Early',
        message: `Lease for "${lease.property.title}" has been terminated. Reason: ${reason}`,
        link: `/properties/${lease.propertyId}`,
        targetRoles: [UserRole.investor],
      });
    }

    return terminatedLease;
  }

  /**
   * Delete a tenant lease
   */
  async remove(id: string) {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id },
    });

    if (!lease) {
      throw new NotFoundException(`Tenant lease with ID ${id} not found`);
    }

    await this.prisma.tenantLease.delete({
      where: { id },
    });

    // Update property vacancy status
    await this.updatePropertyVacancyStatus(lease.propertyId);

    return { message: 'Tenant lease deleted successfully' };
  }

  /**
   * Update property vacancy status based on active leases
   */
  private async updatePropertyVacancyStatus(propertyId: string) {
    const activeLeases = await this.prisma.tenantLease.count({
      where: {
        propertyId,
        isActive: true,
      },
    });

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { isVacant: activeLeases === 0 },
    });
  }

  /**
   * Get leases expiring soon (within next 30 days)
   */
  async findExpiringLeases(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.tenantLease.findMany({
      where: {
        isActive: true,
        leaseEnd: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            buildingName: true,
            ownerId: true,
          },
        },
      },
      orderBy: { leaseEnd: 'asc' },
    });
  }
}
