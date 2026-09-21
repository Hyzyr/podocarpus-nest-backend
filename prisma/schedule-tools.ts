/**
 * Shared rent-collection schedule helpers for seeding and backfilling.
 *
 * A lease with no `RentInstallment` rows is invisible to the collection
 * tracker, the monthly table and every "upcoming / overdue" view — the money
 * may be recorded but there is nothing to compare it against. These helpers
 * give such leases a schedule derived from their own data, and attach the
 * payments that already exist to it.
 *
 * The due dates come from the same `buildSchedule` the API uses, so a
 * backfilled schedule is indistinguishable from one an admin generated.
 */

import {
  InstallmentStatus,
  PaymentType,
  Prisma,
  PrismaClient,
  RentFrequency,
} from '@prisma/client';
import {
  buildSchedule,
  PAID_EPSILON,
  paymentTypeForPeriod,
  round2,
} from '../src/payments/rent-schedule.util';

/** Anything that can run queries: the client itself or a transaction client. */
export type Db = PrismaClient | Prisma.TransactionClient;

export type LeaseForSchedule = {
  id: string;
  leaseStart: Date;
  leaseEnd: Date | null;
  annualRent: number;
};

/**
 * Work out how often this tenant actually pays, from what they have paid.
 *
 * Counting the payments that landed in the lease's first twelve months is the
 * closest thing to ground truth we have: four cheques a year is the UAE norm,
 * corporate tenants tend to pay in one. Leases with no payment history fall
 * back to rent size, which correlates well in this portfolio (the 400k+ leases
 * are commercial, annual-cheque tenants).
 */
export function inferCadence(
  lease: LeaseForSchedule,
  paidDates: Date[],
): Exclude<RentFrequency, 'CUSTOM'> {
  const yearEnd = new Date(lease.leaseStart);
  yearEnd.setUTCFullYear(yearEnd.getUTCFullYear() + 1);
  const inFirstYear = paidDates.filter(
    (d) => d >= lease.leaseStart && d < yearEnd,
  ).length;

  if (inFirstYear >= 7) return RentFrequency.MONTHLY;
  if (inFirstYear >= 5) return RentFrequency.BI_MONTHLY;
  if (inFirstYear >= 3) return RentFrequency.QUARTERLY;
  if (inFirstYear === 2) return RentFrequency.SEMI_ANNUAL;
  if (inFirstYear === 1) return RentFrequency.ANNUAL;

  // No usable history: infer from the rent bracket.
  if (lease.annualRent >= 300_000) return RentFrequency.ANNUAL;
  if (lease.annualRent >= 100_000) return RentFrequency.SEMI_ANNUAL;
  return RentFrequency.QUARTERLY;
}

/**
 * Create the installment rows for a lease. Returns how many were written.
 *
 * Open-ended leases get a single year of dates; `buildSchedule` caps long
 * leases at 120 installments.
 */
export async function createSchedule(
  db: Db,
  lease: LeaseForSchedule,
  cadence: Exclude<RentFrequency, 'CUSTOM'>,
): Promise<number> {
  const planned = buildSchedule({
    frequency: cadence,
    leaseStart: lease.leaseStart,
    leaseEnd: lease.leaseEnd,
    annualAmount: lease.annualRent,
  });
  if (planned.length === 0) return 0;

  await db.rentInstallment.createMany({
    data: planned.map((p) => ({ ...p, tenantLeaseId: lease.id })),
  });
  return planned.length;
}

/**
 * Attach payments that are not linked to any installment.
 *
 * Money is applied the way a landlord applies it: oldest payment against the
 * oldest collection still owing. A cheque bigger than the installment it
 * settles stays whole — it is one payment row, so it over-settles that
 * installment rather than being split across two.
 */
export async function linkPayments(db: Db, leaseId: string): Promise<number> {
  const [installments, payments] = await Promise.all([
    db.rentInstallment.findMany({
      where: { tenantLeaseId: leaseId },
      orderBy: { dueDate: 'asc' },
    }),
    db.rentPayment.findMany({
      where: { tenantLeaseId: leaseId, installmentId: null },
      orderBy: { paidDate: 'asc' },
    }),
  ]);
  if (installments.length === 0 || payments.length === 0) return 0;

  const remaining = installments.map((i) => ({
    id: i.id,
    left: i.amountDue,
  }));
  let cursor = 0;
  let linked = 0;

  for (const payment of payments) {
    while (cursor < remaining.length && remaining[cursor].left <= PAID_EPSILON) {
      cursor++;
    }
    // More money than the schedule expects: leave the rest as ad-hoc payments,
    // which is exactly what they are.
    if (cursor >= remaining.length) break;

    await db.rentPayment.update({
      where: { id: payment.id },
      data: { installmentId: remaining[cursor].id },
    });
    remaining[cursor].left = round2(remaining[cursor].left - payment.amount);
    linked++;
  }

  return linked;
}

/**
 * Re-derive `amountPaid` / `status` / `paidInFullAt` for a lease's schedule.
 *
 * Mirrors `RentScheduleService.recompute` so seeded rows match what the API
 * would have written. WAIVED and CANCELLED are sticky.
 */
export async function recomputeLease(db: Db, leaseId: string): Promise<void> {
  const installments = await db.rentInstallment.findMany({
    where: { tenantLeaseId: leaseId },
    include: { payments: { select: { amount: true, paidDate: true } } },
  });

  for (const inst of installments) {
    const amountPaid = round2(
      inst.payments.reduce((sum, p) => sum + p.amount, 0),
    );
    const sticky =
      inst.status === InstallmentStatus.WAIVED ||
      inst.status === InstallmentStatus.CANCELLED;

    const status = sticky
      ? inst.status
      : amountPaid >= inst.amountDue - PAID_EPSILON
        ? InstallmentStatus.PAID
        : amountPaid > 0
          ? InstallmentStatus.PARTIAL
          : InstallmentStatus.PENDING;

    const paidInFullAt =
      status === InstallmentStatus.PAID
        ? (inst.paidInFullAt ??
          inst.payments.reduce<Date | null>(
            (latest, p) => (!latest || p.paidDate > latest ? p.paidDate : latest),
            null,
          ))
        : null;

    await db.rentInstallment.update({
      where: { id: inst.id },
      data: { amountPaid, status, paidInFullAt },
    });
  }
}

export type BackfillResult = {
  leaseId: string;
  tenantName: string | null;
  cadence: Exclude<RentFrequency, 'CUSTOM'>;
  installments: number;
  linkedPayments: number;
};

/**
 * Give one lease a schedule and wire its existing payments into it.
 * Caller must have checked that the lease has no installments yet.
 */
export async function backfillLease(
  db: Db,
  lease: LeaseForSchedule & { tenantName: string | null },
  paidDates: Date[],
): Promise<BackfillResult | null> {
  const cadence = inferCadence(lease, paidDates);
  const installments = await createSchedule(db, lease, cadence);
  if (installments === 0) return null;

  const linkedPayments = await linkPayments(db, lease.id);
  await recomputeLease(db, lease.id);
  await db.tenantLease.update({
    where: { id: lease.id },
    data: { scheduleUpdatedAt: new Date() },
  });

  return {
    leaseId: lease.id,
    tenantName: lease.tenantName,
    cadence,
    installments,
    linkedPayments,
  };
}

/**
 * Record a payment that settles an installment — the seed's equivalent of an
 * admin pressing "collect". Payment type is derived from the period the
 * installment covers, matching what the API records.
 */
export async function collectInstallment(
  db: Db,
  installment: {
    id: string;
    tenantLeaseId: string;
    amountDue: number;
    dueDate: Date;
    periodStart: Date | null;
    periodEnd: Date | null;
  },
  opts: {
    amount?: number;
    paidDate?: Date;
    recordedById?: string;
    note?: string;
    reference?: string;
  },
): Promise<void> {
  await db.rentPayment.create({
    data: {
      tenantLeaseId: installment.tenantLeaseId,
      installmentId: installment.id,
      amount: round2(opts.amount ?? installment.amountDue),
      paidDate: opts.paidDate ?? installment.dueDate,
      type:
        paymentTypeForPeriod(installment.periodStart, installment.periodEnd) ??
        PaymentType.CUSTOM,
      method: 'Bank Transfer',
      reference: opts.reference ?? null,
      note: opts.note ?? null,
      recordedById: opts.recordedById ?? null,
    },
  });
}
