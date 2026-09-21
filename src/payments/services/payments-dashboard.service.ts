import { Injectable } from '@nestjs/common';
import { InstallmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { PaymentsDashboardQueryDto } from '../dto/rent-schedule.dto';
import {
  DashboardMonthPointDto,
  DashboardStatusBreakdownDto,
  PaymentsDashboardDto,
  RentPaymentDto,
} from '../dto/rent-schedule.response.dto';
import { round2 } from '../rent-schedule.util';
import {
  BILLABLE_STATUSES,
  decorate,
  OPEN_STATUSES,
} from './rent-schedule.service';

const MS_PER_DAY = 86_400_000;

const LEASE_CONTEXT_SELECT = {
  id: true,
  propertyId: true,
  tenantName: true,
  property: { select: { buildingName: true, unitNo: true, title: true } },
} as const;

/**
 * Read model behind the admin collection dashboard: what was collected, what
 * is coming, and what is late.
 *
 * Totals are anchored on the installment schedule rather than on payment dates
 * so "collected" and "scheduled" describe the same set of obligations:
 *
 * - `scheduled` — amount due on installments whose **due date** is in the window
 * - `collectedScheduled` — money received against *those* installments
 * - `collectedAdHoc` — payments **paid** in the window with no installment
 * - `overdue` / `upcoming` — evaluated against *now*, not the window, because
 *   "what needs chasing today" is the question the dashboard is asked.
 */
@Injectable()
export class PaymentsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(
    query: PaymentsDashboardQueryDto,
  ): Promise<PaymentsDashboardDto> {
    const now = new Date();
    const { from, to } = resolveRange(query, now);
    const listSize = query.listSize ?? 10;
    const upcomingDays = query.upcomingDays ?? 60;
    const upcomingUntil = new Date(now.getTime() + upcomingDays * MS_PER_DAY);

    const propertyScope: Prisma.TenantLeaseWhereInput | undefined =
      query.propertyId ? { propertyId: query.propertyId } : undefined;

    const inRange: Prisma.RentInstallmentWhereInput = {
      dueDate: { gte: from, lte: to },
      ...(propertyScope && { tenantLease: propertyScope }),
    };

    const [
      windowed,
      windowPayments,
      openInstallments,
      overdue,
      upcoming,
      recent,
    ] = await Promise.all([
      // Everything due inside the window, for totals, breakdown and chart.
      this.prisma.rentInstallment.findMany({
        where: inRange,
        select: {
          dueDate: true,
          amountDue: true,
          amountPaid: true,
          status: true,
        },
      }),

      // Every payment in the window. Needed in full, not just the ad-hoc ones:
      // the `received` series has to chart leases that have no schedule yet,
      // whose money is all ad-hoc but is still real cash in the month.
      this.prisma.rentPayment.findMany({
        where: {
          paidDate: { gte: from, lte: to },
          ...(propertyScope && { tenantLease: propertyScope }),
        },
        select: { amount: true, paidDate: true, installmentId: true },
      }),

      // Every still-open installment, for the overdue/upcoming totals.
      this.prisma.rentInstallment.findMany({
        where: {
          status: { in: OPEN_STATUSES },
          ...(propertyScope && { tenantLease: propertyScope }),
        },
        select: { dueDate: true, amountDue: true, amountPaid: true },
      }),

      this.prisma.rentInstallment.findMany({
        where: {
          status: { in: OPEN_STATUSES },
          dueDate: { lt: now },
          ...(propertyScope && { tenantLease: propertyScope }),
        },
        orderBy: { dueDate: 'asc' },
        take: listSize,
        include: {
          payments: { orderBy: { paidDate: 'asc' } },
          tenantLease: { select: LEASE_CONTEXT_SELECT },
        },
      }),

      this.prisma.rentInstallment.findMany({
        where: {
          status: { in: OPEN_STATUSES },
          dueDate: { gte: now, lte: upcomingUntil },
          ...(propertyScope && { tenantLease: propertyScope }),
        },
        orderBy: { dueDate: 'asc' },
        take: listSize,
        include: {
          payments: { orderBy: { paidDate: 'asc' } },
          tenantLease: { select: LEASE_CONTEXT_SELECT },
        },
      }),

      this.prisma.rentPayment.findMany({
        where: {
          paidDate: { gte: from, lte: to },
          ...(propertyScope && { tenantLease: propertyScope }),
        },
        orderBy: { paidDate: 'desc' },
        take: listSize,
        include: { tenantLease: { select: LEASE_CONTEXT_SELECT } },
      }),
    ]);

    const billable = windowed.filter((i) =>
      BILLABLE_STATUSES.includes(i.status),
    );

    const scheduled = round2(billable.reduce((s, i) => s + i.amountDue, 0));
    const collectedScheduled = round2(
      billable.reduce((s, i) => s + i.amountPaid, 0),
    );
    const collectedAdHoc = round2(
      windowPayments
        .filter((p) => !p.installmentId)
        .reduce((s, p) => s + p.amount, 0),
    );

    const overdueOpen = openInstallments.filter((i) => i.dueDate < now);
    const upcomingOpen = openInstallments.filter(
      (i) => i.dueDate >= now && i.dueDate <= upcomingUntil,
    );
    const balanceOf = (i: { amountDue: number; amountPaid: number }) =>
      Math.max(0, i.amountDue - i.amountPaid);

    return {
      generatedAt: now,
      range: { from, to },
      totals: {
        scheduled,
        collected: round2(collectedScheduled + collectedAdHoc),
        collectedScheduled,
        collectedAdHoc,
        outstanding: round2(Math.max(0, scheduled - collectedScheduled)),
        overdueAmount: round2(
          overdueOpen.reduce((s, i) => s + balanceOf(i), 0),
        ),
        overdueCount: overdueOpen.length,
        upcomingAmount: round2(
          upcomingOpen.reduce((s, i) => s + balanceOf(i), 0),
        ),
        upcomingCount: upcomingOpen.length,
        collectionRate:
          scheduled > 0
            ? Math.round((collectedScheduled / scheduled) * 100)
            : 0,
      },
      byStatus: countByStatus(windowed),
      monthly: buildMonthly(windowed, windowPayments, from, to),
      overdue: overdue.map((i) => decorate(i, now)),
      upcoming: upcoming.map((i) => decorate(i, now)),
      recentPayments: recent.map(shapePayment),
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Explicit from/to wins; otherwise the calendar year, defaulting to this one. */
function resolveRange(
  query: PaymentsDashboardQueryDto,
  now: Date,
): { from: Date; to: Date } {
  if (query.from || query.to) {
    return {
      from: query.from ? new Date(query.from) : new Date(0),
      to: query.to ? new Date(query.to) : new Date(8.64e15),
    };
  }
  const year = query.year ?? now.getUTCFullYear();
  return {
    from: new Date(Date.UTC(year, 0, 1)),
    to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

function countByStatus(
  rows: { status: InstallmentStatus }[],
): DashboardStatusBreakdownDto {
  const empty: DashboardStatusBreakdownDto = {
    PENDING: 0,
    PARTIAL: 0,
    PAID: 0,
    WAIVED: 0,
    CANCELLED: 0,
  };
  return rows.reduce((acc, r) => {
    acc[r.status] += 1;
    return acc;
  }, empty);
}

/**
 * Three series per month across the window.
 *
 * - `scheduled` / `collected` come from the installments, bucketed by **due
 *   date**, so a bar and its target always describe the same obligations.
 * - `received` comes from the payments, bucketed by **paid date**, and includes
 *   ad-hoc money.
 *
 * `received` exists because the first two are zero for a lease with no schedule,
 * which is every lease that predates schedules. Charting `collected` alone made
 * a database full of real payments look empty. Plot `received` for cash flow;
 * plot `scheduled` vs `collected` for collection performance.
 */
function buildMonthly(
  rows: {
    dueDate: Date;
    amountDue: number;
    amountPaid: number;
    status: InstallmentStatus;
  }[],
  payments: { paidDate: Date; amount: number }[],
  from: Date,
  to: Date,
): DashboardMonthPointDto[] {
  const buckets = new Map<string, DashboardMonthPointDto>();
  const blank = (month: string): DashboardMonthPointDto => ({
    month,
    scheduled: 0,
    collected: 0,
    received: 0,
  });

  // Seed every month in the window so gaps render as zero, not as missing bars.
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cursor <= end && buckets.size < 120) {
    buckets.set(monthKey(cursor), blank(monthKey(cursor)));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  for (const row of rows) {
    if (!BILLABLE_STATUSES.includes(row.status)) continue;
    const key = monthKey(row.dueDate);
    const bucket = buckets.get(key) ?? blank(key);
    bucket.scheduled = round2(bucket.scheduled + row.amountDue);
    bucket.collected = round2(bucket.collected + row.amountPaid);
    buckets.set(key, bucket);
  }

  for (const payment of payments) {
    const key = monthKey(payment.paidDate);
    const bucket = buckets.get(key) ?? blank(key);
    bucket.received = round2(bucket.received + payment.amount);
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

const monthKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

type PaymentRow = Prisma.RentPaymentGetPayload<object> & {
  tenantLease?: {
    id: string;
    propertyId: string;
    tenantName: string | null;
    property: {
      buildingName: string | null;
      unitNo: string | null;
      title: string;
    };
  };
};

/** Attach lease/property identity so a payment row is renderable on its own. */
function shapePayment(row: PaymentRow): RentPaymentDto {
  const { tenantLease, ...payment } = row;
  return {
    ...payment,
    ...(tenantLease && {
      context: {
        leaseId: tenantLease.id,
        propertyId: tenantLease.propertyId,
        tenantName: tenantLease.tenantName,
        buildingName: tenantLease.property.buildingName,
        unitNo: tenantLease.property.unitNo,
        propertyTitle: tenantLease.property.title,
      },
    }),
  };
}
