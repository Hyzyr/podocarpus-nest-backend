import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, recordedById: string) {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id: dto.tenantLeaseId },
    });
    if (!lease) {
      throw new NotFoundException(
        `Tenant lease with ID ${dto.tenantLeaseId} not found`,
      );
    }

    return this.prisma.rentPayment.create({
      data: {
        tenantLeaseId: dto.tenantLeaseId,
        amount: dto.amount,
        paidDate: new Date(dto.paidDate),
        type: dto.type,
        note: dto.note,
        recordedById,
      },
    });
  }

  async findByLease(leaseId: string) {
    return this.prisma.rentPayment.findMany({
      where: { tenantLeaseId: leaseId },
      orderBy: { paidDate: 'desc' },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.rentPayment.findMany({
      where: {
        tenantLease: { propertyId },
      },
      orderBy: { paidDate: 'desc' },
      include: {
        tenantLease: {
          select: { tenantName: true, propertyId: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return this.prisma.rentPayment.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paidDate && { paidDate: new Date(dto.paidDate) }),
        ...(dto.type && { type: dto.type }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }

  async remove(id: string) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return this.prisma.rentPayment.delete({ where: { id } });
  }

  async getCollectionTracker(year: number) {
    const properties = await this.prisma.property.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        buildingName: true,
        unitNo: true,
        tenantLeases: {
          where: { isActive: true },
          select: {
            id: true,
            tenantName: true,
            monthlyRent: true,
            annualRent: true,
            payments: {
              where: {
                paidDate: {
                  gte: new Date(`${year}-01-01`),
                  lt: new Date(`${year + 1}-01-01`),
                },
              },
              select: {
                id: true,
                amount: true,
                paidDate: true,
                type: true,
                note: true,
              },
              orderBy: { paidDate: 'asc' },
            },
          },
          take: 1,
          orderBy: { leaseStart: 'desc' },
        },
      },
      orderBy: [{ buildingName: 'asc' }, { unitNo: 'asc' }],
    });

    let totalAnnualRent = 0;
    let totalCollected = 0;
    let occupied = 0;
    let vacant = 0;

    const rows = properties.map((prop) => {
      const lease = prop.tenantLeases[0];
      const isVacant = !lease;

      if (isVacant) {
        vacant++;
        return {
          propertyId: prop.id,
          building: prop.buildingName,
          unit: prop.unitNo,
          tenant: null,
          annualRent: null,
          collected: 0,
          remaining: null,
          percent: null,
          type: null,
          payments: [],
        };
      }

      occupied++;
      const annual = lease.annualRent ?? lease.monthlyRent * 12;
      const collected = lease.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = annual - collected;

      totalAnnualRent += annual;
      totalCollected += collected;

      return {
        propertyId: prop.id,
        building: prop.buildingName,
        unit: prop.unitNo,
        tenant: lease.tenantName,
        annualRent: annual,
        collected,
        remaining,
        percent: annual > 0 ? Math.round((collected / annual) * 100) : 0,
        type: lease.annualRent ? 'ANNUAL' : 'MONTHLY',
        payments: lease.payments,
      };
    });

    return {
      year,
      summary: {
        totalProperties: properties.length,
        occupied,
        vacant,
        totalAnnualRent,
        totalCollected,
        totalRemaining: totalAnnualRent - totalCollected,
        collectionRate:
          totalAnnualRent > 0
            ? Math.round((totalCollected / totalAnnualRent) * 100)
            : 0,
      },
      properties: rows,
    };
  }
}
