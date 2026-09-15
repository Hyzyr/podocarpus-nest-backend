import { RentFrequency, PaymentType } from '@prisma/client';

/** How many collections a frequency produces over twelve months. */
export const COLLECTIONS_PER_YEAR: Record<RentFrequency, number> = {
  ANNUAL: 1,
  SEMI_ANNUAL: 2,
  QUARTERLY: 4,
  BI_MONTHLY: 6,
  MONTHLY: 12,
  CUSTOM: 0, // dates are supplied by hand
};

/** The `PaymentType` that matches a lease frequency, for payment rows. */
export const FREQUENCY_TO_PAYMENT_TYPE: Record<RentFrequency, PaymentType> = {
  ANNUAL: PaymentType.ANNUAL,
  SEMI_ANNUAL: PaymentType.SEMI_ANNUAL,
  QUARTERLY: PaymentType.QUARTERLY,
  BI_MONTHLY: PaymentType.BI_MONTHLY,
  MONTHLY: PaymentType.MONTHLY,
  CUSTOM: PaymentType.CUSTOM,
};

/** Guard against a typo'd request generating thousands of rows. */
export const MAX_INSTALLMENTS = 120;

/** Money is stored as a float; compare and store at 2dp. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Tolerance for "fully paid" so float noise never leaves a 0.001 balance. */
export const PAID_EPSILON = 0.005;

/** Most months a single monthly-view request may span (10 years). */
export const MAX_MONTH_COLUMNS = 120;

/** The bucket key a date falls into: `"2026-03"`. Always UTC. */
export const monthKey = (d: Date): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/**
 * Every month key from `from` to `to` inclusive.
 *
 * Callers seed their buckets with this so a month with no activity renders as a
 * zero column rather than disappearing from the table.
 */
export function eachMonth(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

  while (cursor <= end && keys.length < MAX_MONTH_COLUMNS) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

/**
 * Add whole months in UTC, clamping the day to the target month's length so
 * 31 Jan + 1 month is 28/29 Feb rather than rolling into March.
 */
export function addMonthsUtc(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(day, lastDay),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  );
}

/** Whole months between two dates, rounded up. Never negative. */
export function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  return Math.max(
    0,
    to.getUTCDate() >= from.getUTCDate() ? months : months - 1,
  );
}

export interface PlannedInstallment {
  sequence: number;
  dueDate: Date;
  amountDue: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BuildScheduleInput {
  /** Cadence. `CUSTOM` is rejected here — those dates come straight from the admin. */
  frequency: Exclude<RentFrequency, 'CUSTOM'>;
  /** Lease start; also the default first due date. */
  leaseStart: Date;
  /** Lease end, if known. Generation stops once a due date passes it. */
  leaseEnd?: Date | null;
  /** Rent expected per twelve months. Split across that year's installments. */
  annualAmount: number;
  /** First collection date. Defaults to `leaseStart`. */
  firstDueDate?: Date | null;
  /** Force every due date onto this day of month (1-28). */
  anchorDay?: number | null;
  /** Explicit installment count. Overrides the lease-length calculation. */
  count?: number | null;
}

/**
 * Turn a cadence into concrete due dates and amounts.
 *
 * Amounts are split evenly within each twelve-month cycle and the cycle's last
 * installment absorbs the rounding remainder, so the cycle always sums to
 * exactly `annualAmount`.
 */
export function buildSchedule(input: BuildScheduleInput): PlannedInstallment[] {
  const perYear = COLLECTIONS_PER_YEAR[input.frequency];
  const stepMonths = 12 / perYear;

  const start = normaliseStart(
    input.firstDueDate ?? input.leaseStart,
    input.anchorDay,
  );

  const total = resolveCount(input, start, perYear);

  const base = round2(input.annualAmount / perYear);
  const lastOfCycle = round2(input.annualAmount - base * (perYear - 1));

  const planned: PlannedInstallment[] = [];
  for (let i = 0; i < total; i++) {
    const dueDate = addMonthsUtc(start, i * stepMonths);
    if (input.leaseEnd && dueDate > input.leaseEnd) break;

    const periodEnd = new Date(
      addMonthsUtc(dueDate, stepMonths).getTime() - 86_400_000,
    );

    planned.push({
      sequence: i + 1,
      dueDate,
      // Last slot of each twelve-month cycle carries the rounding remainder.
      amountDue: (i + 1) % perYear === 0 ? lastOfCycle : base,
      periodStart: dueDate,
      periodEnd:
        input.leaseEnd && periodEnd > input.leaseEnd
          ? input.leaseEnd
          : periodEnd,
    });
  }

  return planned;
}

/** Apply the anchor day (clamped to 1-28 so every month can hold it). */
function normaliseStart(date: Date, anchorDay?: number | null): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  if (!anchorDay) return start;
  start.setUTCDate(Math.min(Math.max(anchorDay, 1), 28));
  return start;
}

/** Explicit count wins; otherwise cover the lease term, defaulting to one year. */
function resolveCount(
  input: BuildScheduleInput,
  start: Date,
  perYear: number,
): number {
  if (input.count && input.count > 0) {
    return Math.min(input.count, MAX_INSTALLMENTS);
  }
  if (!input.leaseEnd) return perYear;

  const months = monthsBetween(start, input.leaseEnd);
  const years = Math.max(1, Math.ceil(months / 12));
  return Math.min(years * perYear, MAX_INSTALLMENTS);
}
