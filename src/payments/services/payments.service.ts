import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { ApiErrorCode } from 'src/common/http/api-error';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto/payment.dto';
import { RentScheduleService } from './rent-schedule.service';
import { round2 } from '../rent-schedule.util';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedule: RentScheduleService,
  ) {}

  /**
   * Record money received.
   *
   * When the payment names an installment, that installment's paid total and
   * status are re-derived so the schedule never disagrees with the ledger.
   */
  async create(dto: CreatePaymentDto, recordedById: string) {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id: dto.tenantLeaseId },
      select: { id: true },
    });
    if (!lease) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Tenant lease with ID ${dto.tenantLeaseId} not found`,
      });
    }

    if (dto.installmentId) {
      await this.assertInstallmentOnLease(dto.installmentId, dto.tenantLeaseId);
    }

    const payment = await this.prisma.rentPayment.create({
      data: {
        tenantLeaseId: dto.tenantLeaseId,
        installmentId: dto.installmentId ?? null,
        amount: round2(dto.amount),
        paidDate: new Date(dto.paidDate),
        type: dto.type,
        method: dto.method ?? null,
        reference: dto.reference ?? null,
        note: dto.note,
        recordedById,
      },
    });

    if (payment.installmentId) {
      await this.schedule.recompute(payment.installmentId);
    }

    return payment;
  }

  async findByLease(leaseId: string) {
    return this.prisma.rentPayment.findMany({
      where: { tenantLeaseId: leaseId },
      orderBy: { paidDate: 'desc' },
      include: {
        installment: {
          select: { id: true, sequence: true, dueDate: true, amountDue: true },
        },
      },
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
        installment: {
          select: { id: true, sequence: true, dueDate: true, amountDue: true },
        },
      },
    });
  }

  /**
   * Correct a recorded payment.
   *
   * Both the old and the new installment are re-derived, so moving a payment
   * between dates cannot leave the one it left behind marked PAID.
   */
  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Payment with ID ${id} not found`,
      });
    }

    if (dto.installmentId) {
      await this.assertInstallmentOnLease(
        dto.installmentId,
        payment.tenantLeaseId,
      );
    }

    const updated = await this.prisma.rentPayment.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: round2(dto.amount) }),
        ...(dto.paidDate && { paidDate: new Date(dto.paidDate) }),
        ...(dto.type && { type: dto.type }),
        ...(dto.installmentId !== undefined && {
          installmentId: dto.installmentId,
        }),
        ...(dto.method !== undefined && { method: dto.method }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });

    await this.recomputeAffected(payment.installmentId, updated.installmentId);

    return updated;
  }

  async remove(id: string) {
    const payment = await this.prisma.rentPayment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Payment with ID ${id} not found`,
      });
    }

    await this.prisma.rentPayment.delete({ where: { id } });

    if (payment.installmentId) {
      await this.schedule.recompute(payment.installmentId);
    }

    return { success: true, message: 'Payment deleted' };
  }

  /** Re-derive every installment a write may have touched, without duplicates. */
  private async recomputeAffected(...ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    for (const id of unique) {
      await this.schedule.recompute(id);
    }
  }

  /** A payment may only be attached to an installment on its own lease. */
  private async assertInstallmentOnLease(
    installmentId: string,
    tenantLeaseId: string,
  ) {
    const installment = await this.prisma.rentInstallment.findUnique({
      where: { id: installmentId },
      select: { tenantLeaseId: true },
    });
    if (!installment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Installment with ID ${installmentId} not found`,
      });
    }
    if (installment.tenantLeaseId !== tenantLeaseId) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'That installment belongs to a different lease.',
      });
    }
  }

  /**
   * Per-unit collection table for a calendar year.
   *
   * Leases with a generated schedule report against it (expected = sum of the
   * year's installments). Leases created before schedules existed fall back to
   * `annualRent`, so the view keeps working without a backfill.
   */
  async getCollectionTracker(year: number) {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

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
            paymentFrequency: true,
            payments: {
              where: { paidDate: { gte: yearStart, lt: yearEnd } },
              select: {
                id: true,
                amount: true,
                paidDate: true,
                type: true,
                note: true,
                installmentId: true,
              },
              orderBy: { paidDate: 'asc' },
            },
            installments: {
              where: { dueDate: { gte: yearStart, lt: yearEnd } },
              select: {
                id: true,
                sequence: true,
                dueDate: true,
                amountDue: true,
                amountPaid: true,
                status: true,
              },
              orderBy: { dueDate: 'asc' },
            },
          },
          take: 1,
          orderBy: { leaseStart: 'desc' },
        },
      },
      orderBy: [{ buildingName: 'asc' }, { unitNo: 'asc' }],
    });

    const now = new Date();
    let totalAnnualRent = 0;
    let totalCollected = 0;
    let occupied = 0;
    let vacant = 0;

    const rows = properties.map((prop) => {
      const lease = prop.tenantLeases[0];

      if (!lease) {
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
          frequency: null,
          scheduled: false,
          overdueCount: 0,
          nextDueDate: null,
          installments: [],
          payments: [],
        };
      }

      occupied++;

      // Only PENDING/PARTIAL/PAID count as owed; waived and cancelled do not.
      const billable = lease.installments.filter(
        (i) => i.status !== 'WAIVED' && i.status !== 'CANCELLED',
      );
      const hasSchedule = billable.length > 0;

      const annual = hasSchedule
        ? round2(billable.reduce((s, i) => s + i.amountDue, 0))
        : (lease.annualRent ?? lease.monthlyRent * 12);

      const collected = round2(
        lease.payments.reduce((s, p) => s + p.amount, 0),
      );
      const open = billable.filter(
        (i) => i.status === 'PENDING' || i.status === 'PARTIAL',
      );

      totalAnnualRent += annual;
      totalCollected += collected;

      return {
        propertyId: prop.id,
        building: prop.buildingName,
        unit: prop.unitNo,
        tenant: lease.tenantName,
        annualRent: annual,
        collected,
        remaining: round2(annual - collected),
        percent: annual > 0 ? Math.round((collected / annual) * 100) : 0,
        type: lease.annualRent ? 'ANNUAL' : 'MONTHLY',
        frequency: lease.paymentFrequency,
        scheduled: hasSchedule,
        overdueCount: open.filter(
          (i) => i.dueDate < now && i.amountPaid < i.amountDue,
        ).length,
        nextDueDate: open.find((i) => i.dueDate >= now)?.dueDate ?? null,
        installments: lease.installments,
        payments: lease.payments,
      };
    });

    return {
      year,
      summary: {
        totalProperties: properties.length,
        occupied,
        vacant,
        totalAnnualRent: round2(totalAnnualRent),
        totalCollected: round2(totalCollected),
        totalRemaining: round2(totalAnnualRent - totalCollected),
        collectionRate:
          totalAnnualRent > 0
            ? Math.round((totalCollected / totalAnnualRent) * 100)
            : 0,
      },
      properties: rows,
    };
  }
}
