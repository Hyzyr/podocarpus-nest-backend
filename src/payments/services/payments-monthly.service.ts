import { Injectable } from '@nestjs/common';
import { InstallmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { MonthlyViewQueryDto } from '../dto/monthly-view.dto';
import {
  MonthlyCellDto,
  MonthlyCellStatus,
  MonthlyColumnDto,
  MonthlyRowDto,
  MonthlyViewDto,
} from '../dto/monthly-view.response.dto';
import { RentInstallmentDto } from '../dto/rent-schedule.response.dto';
import { eachMonth, monthKey, round2 } from '../rent-schedule.util';
import { BILLABLE_STATUSES, decorate } from './rent-schedule.service';

/**
 * The month-by-month collection table — tenants down, months across.
 *
 * Built server-side rather than left to the client because the two halves of a
 * cell come from different places: what was *owed* comes from installments
 * (bucketed by due date) and what *arrived* comes from payments (bucketed by
 * paid date), and ad-hoc payments have no due date to bucket by at all. Doing
 * it here also means one query instead of one request per month.
 */
@Injectable()
export class PaymentsMonthlyService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyView(query: MonthlyViewQueryDto): Promise<MonthlyViewDto> {
    const now = new Date();
    const { from, to } = resolveRange(query, now);
    const monthKeys = eachMonth(from, to);
    const includePayments = query.includePayments ?? true;
    const currentMonth = monthKey(now);

    const leases = await this.prisma.tenantLease.findMany({
      where: this.buildWhere(query, from, to),
      orderBy: [{ isActive: 'desc' }, { leaseStart: 'desc' }],
      include: {
        property: {
          select: { buildingName: true, unitNo: true, title: true },
        },
        // Owed: bucketed by due date.
        installments: {
          where: { dueDate: { gte: from, lte: to } },
          orderBy: { dueDate: 'asc' },
          include: { payments: { orderBy: { paidDate: 'asc' } } },
        },
        // Arrived: bucketed by paid date. Includes ad-hoc payments, which have
        // no installment and so would be invisible in the schedule alone.
        payments: {
          where: { paidDate: { gte: from, lte: to } },
          orderBy: { paidDate: 'asc' },
        },
        _count: { select: { installments: true } },
      },
    });

    const rows = leases
      .map((lease) => this.buildRow(lease, monthKeys, now, includePayments))
      .filter((row) => !query.hideEmptyRows || isNotEmpty(row));

    return {
      generatedAt: now,
      range: { from, to },
      months: buildColumns(monthKeys, rows, currentMonth),
      rows,
      totals: buildGrandTotals(rows),
    };
  }

  /** Leases that overlap the window, plus whatever scope filters were sent. */
  private buildWhere(
    query: MonthlyViewQueryDto,
    from: Date,
    to: Date,
  ): Prisma.TenantLeaseWhereInput {
    return {
      ...(query.leaseId && { id: query.leaseId }),
      ...(query.propertyId && { propertyId: query.propertyId }),
      ...(query.activeLeasesOnly && { isActive: true }),
      // Overlap, not containment: a lease that started before the window and
      // runs into it still owes rent inside it.
      leaseStart: { lte: to },
      OR: [{ leaseEnd: null }, { leaseEnd: { gte: from } }],
    };
  }

  private buildRow(
    lease: LeaseRow,
    monthKeys: string[],
    now: Date,
    includePayments: boolean,
  ): MonthlyRowDto {
    const installmentsByMonth = groupBy(lease.installments, (i) =>
      monthKey(i.dueDate),
    );
    const paymentsByMonth = groupBy(lease.payments, (p) =>
      monthKey(p.paidDate),
    );

    const cells = monthKeys.map((month) =>
      buildCell(
        month,
        (installmentsByMonth.get(month) ?? []).map((i) => decorate(i, now)),
        paymentsByMonth.get(month) ?? [],
        includePayments,
      ),
    );

    const scheduled = round2(cells.reduce((s, c) => s + c.amountDue, 0));
    const collected = round2(cells.reduce((s, c) => s + c.amountPaid, 0));

    return {
      leaseId: lease.id,
      propertyId: lease.propertyId,
      tenantName: lease.tenantName,
      buildingName: lease.property.buildingName,
      unitNo: lease.property.unitNo,
      propertyTitle: lease.property.title,
      paymentFrequency: lease.paymentFrequency,
      leaseStart: lease.leaseStart,
      leaseEnd: lease.leaseEnd,
      isActive: lease.isActive,
      hasSchedule: lease._count.installments > 0,
      totals: {
        scheduled,
        collected,
        received: round2(cells.reduce((s, c) => s + c.receivedInMonth, 0)),
        outstanding: round2(Math.max(0, scheduled - collected)),
        overdueCount: cells.reduce(
          (s, c) => s + c.installments.filter((i) => i.isOverdue).length,
          0,
        ),
        overdueAmount: round2(
          cells.reduce(
            (s, c) =>
              s +
              c.installments
                .filter((i) => i.isOverdue)
                .reduce((t, i) => t + i.balance, 0),
            0,
          ),
        ),
        collectionRate:
          scheduled > 0 ? Math.round((collected / scheduled) * 100) : 0,
      },
      cells,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Cell + column assembly                                                     */
/* -------------------------------------------------------------------------- */

function buildCell(
  month: string,
  installments: RentInstallmentDto[],
  payments: PaymentRow[],
  includePayments: boolean,
): MonthlyCellDto {
  const billable = installments.filter((i) =>
    BILLABLE_STATUSES.includes(i.status),
  );
  const overdue = installments.filter((i) => i.isOverdue);

  const amountDue = round2(billable.reduce((s, i) => s + i.amountDue, 0));
  const amountPaid = round2(billable.reduce((s, i) => s + i.amountPaid, 0));
  const adHoc = payments.filter((p) => !p.installmentId);

  return {
    month,
    status: cellStatus(installments, billable, overdue, payments),
    amountDue,
    amountPaid,
    balance: round2(Math.max(0, amountDue - amountPaid)),
    receivedInMonth: round2(payments.reduce((s, p) => s + p.amount, 0)),
    adHocInMonth: round2(adHoc.reduce((s, p) => s + p.amount, 0)),
    isOverdue: overdue.length > 0,
    daysOverdue: overdue.reduce((max, i) => Math.max(max, i.daysOverdue), 0),
    installments,
    ...(includePayments && { payments }),
  };
}

/**
 * Worst-case state across whatever the month holds. Order matters.
 *
 * The status describes the month's **obligation**, not the cash that happened to
 * land in it. A tenant paying January's rent in March leaves March `NONE` with a
 * non-zero `receivedInMonth` — the money belongs to January's cell, which is
 * where it shows as paid.
 */
function cellStatus(
  all: RentInstallmentDto[],
  billable: RentInstallmentDto[],
  overdue: RentInstallmentDto[],
  payments: PaymentRow[],
): MonthlyCellStatus {
  if (all.length === 0) {
    // AD_HOC only for money that settles nothing scheduled anywhere. Payments
    // attached to another month's installment are that month's business.
    return payments.some((p) => !p.installmentId)
      ? MonthlyCellStatus.AD_HOC
      : MonthlyCellStatus.NONE;
  }
  if (billable.length === 0) {
    // Everything here was closed out by hand.
    return all.every((i) => i.status === InstallmentStatus.CANCELLED)
      ? MonthlyCellStatus.CANCELLED
      : MonthlyCellStatus.WAIVED;
  }
  if (overdue.length > 0) return MonthlyCellStatus.OVERDUE;
  if (billable.every((i) => i.status === InstallmentStatus.PAID)) {
    return MonthlyCellStatus.PAID;
  }
  if (billable.some((i) => i.amountPaid > 0)) return MonthlyCellStatus.PARTIAL;
  return MonthlyCellStatus.PENDING;
}

/** Column headers with their own totals, so the footer row needs no client maths. */
function buildColumns(
  monthKeys: string[],
  rows: MonthlyRowDto[],
  currentMonth: string,
): MonthlyColumnDto[] {
  return monthKeys.map((month, idx) => {
    const cells = rows.map((r) => r.cells[idx]);
    const due = cells.filter((c) => c.amountDue > 0);

    const scheduled = round2(cells.reduce((s, c) => s + c.amountDue, 0));
    const collected = round2(cells.reduce((s, c) => s + c.amountPaid, 0));

    return {
      month,
      isPast: month < currentMonth,
      isCurrent: month === currentMonth,
      isFuture: month > currentMonth,
      scheduled,
      collected,
      received: round2(cells.reduce((s, c) => s + c.receivedInMonth, 0)),
      outstanding: round2(Math.max(0, scheduled - collected)),
      overdueAmount: round2(
        cells.reduce(
          (s, c) =>
            s +
            c.installments
              .filter((i) => i.isOverdue)
              .reduce((t, i) => t + i.balance, 0),
          0,
        ),
      ),
      dueCount: due.length,
      paidCount: cells.filter((c) => c.status === MonthlyCellStatus.PAID)
        .length,
      partialCount: cells.filter((c) => c.status === MonthlyCellStatus.PARTIAL)
        .length,
      pendingCount: cells.filter((c) => c.status === MonthlyCellStatus.PENDING)
        .length,
      overdueCount: cells.filter((c) => c.status === MonthlyCellStatus.OVERDUE)
        .length,
    };
  });
}

function buildGrandTotals(rows: MonthlyRowDto[]) {
  const scheduled = round2(rows.reduce((s, r) => s + r.totals.scheduled, 0));
  const collected = round2(rows.reduce((s, r) => s + r.totals.collected, 0));

  return {
    leases: rows.length,
    scheduled,
    collected,
    received: round2(rows.reduce((s, r) => s + r.totals.received, 0)),
    outstanding: round2(Math.max(0, scheduled - collected)),
    overdueAmount: round2(rows.reduce((s, r) => s + r.totals.overdueAmount, 0)),
    overdueCount: rows.reduce((s, r) => s + r.totals.overdueCount, 0),
    collectionRate:
      scheduled > 0 ? Math.round((collected / scheduled) * 100) : 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Explicit from/to wins, snapped to whole months; otherwise a calendar year. */
function resolveRange(
  query: MonthlyViewQueryDto,
  now: Date,
): { from: Date; to: Date } {
  if (query.from || query.to) {
    const from = query.from ? new Date(query.from) : new Date(now);
    const to = query.to ? new Date(query.to) : new Date(now);
    return {
      from: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)),
      to: new Date(
        Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      ),
    };
  }
  const year = query.year ?? now.getUTCFullYear();
  return {
    from: new Date(Date.UTC(year, 0, 1)),
    to: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

const isNotEmpty = (row: MonthlyRowDto) =>
  row.totals.scheduled > 0 || row.totals.received > 0;

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

/* ------------------------------- row types -------------------------------- */

type PaymentRow = Prisma.RentPaymentGetPayload<object>;

type LeaseRow = Prisma.TenantLeaseGetPayload<{
  include: {
    property: { select: { buildingName: true; unitNo: true; title: true } };
    installments: { include: { payments: true } };
    payments: true;
    _count: { select: { installments: true } };
  };
}>;
