import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentFrequency } from '@prisma/client';
import {
  RentInstallmentDto,
  RentPaymentDto,
} from './rent-schedule.response.dto';

/**
 * Roll-up state of one tenant-month cell.
 *
 * A month can hold zero, one or several installments (a MONTHLY lease has one,
 * a QUARTERLY lease has one in three, a CUSTOM schedule may have two), so the
 * cell reports the worst-case state across whatever it contains.
 */
export enum MonthlyCellStatus {
  /**
   * Nothing was owed for this month. `receivedInMonth` can still be non-zero —
   * that is money for another month's installment arriving here.
   */
  NONE = 'NONE',
  /** Due, nothing collected, not yet late. */
  PENDING = 'PENDING',
  /** Part collected, balance outstanding. */
  PARTIAL = 'PARTIAL',
  /** Everything due in this month is settled. */
  PAID = 'PAID',
  /** Something due here is unsettled and past its date. */
  OVERDUE = 'OVERDUE',
  /** Everything due here was waived. */
  WAIVED = 'WAIVED',
  /** Everything due here was cancelled. */
  CANCELLED = 'CANCELLED',
  /** Nothing was scheduled, and unscheduled money arrived (late fee, extra). */
  AD_HOC = 'AD_HOC',
}

/**
 * One tenant × one month.
 *
 * Two different questions are answered side by side, and they are not the same
 * number — read the field names carefully:
 *
 * - `amountDue` / `amountPaid` / `balance` describe **what was owed for this
 *   month**, wherever the money eventually landed.
 * - `receivedInMonth` / `payments` describe **what arrived during this month**,
 *   whatever it was for.
 *
 * A tenant who pays January's rent in March makes January's `amountPaid` rise
 * and March's `receivedInMonth` rise.
 */
export class MonthlyCellDto {
  @ApiProperty({ example: '2026-03', description: 'UTC month bucket' })
  month: string;

  @ApiProperty({ enum: MonthlyCellStatus })
  status: MonthlyCellStatus;

  @ApiProperty({
    example: 30000,
    description: 'Scheduled for this month, excluding waived and cancelled',
  })
  amountDue: number;

  @ApiProperty({
    example: 30000,
    description: 'Collected against this month, regardless of when it was paid',
  })
  amountPaid: number;

  @ApiProperty({
    example: 0,
    description: 'amountDue - amountPaid, floored at 0',
  })
  balance: number;

  @ApiProperty({
    example: 32500,
    description:
      'Money that arrived during this month, scheduled and ad-hoc together',
  })
  receivedInMonth: number;

  @ApiProperty({
    example: 2500,
    description:
      'Part of receivedInMonth with no installment attached (late fee, off-schedule)',
  })
  adHocInMonth: number;

  @ApiProperty({ description: 'Something here is unsettled and past due' })
  isOverdue: boolean;

  @ApiProperty({
    example: 0,
    description: 'Days past due of the latest overdue installment; 0 if none',
  })
  daysOverdue: number;

  @ApiProperty({
    type: [RentInstallmentDto],
    description:
      'Installments due in this month. Empty for an unscheduled month.',
  })
  installments: RentInstallmentDto[];

  @ApiPropertyOptional({
    type: [RentPaymentDto],
    description:
      'Payments received during this month — the history for a past month. Omitted when includePayments=false.',
  })
  payments?: RentPaymentDto[];
}

/** Per-lease totals across the whole window. */
export class MonthlyRowTotalsDto {
  @ApiProperty({ example: 120000 }) scheduled: number;
  @ApiProperty({
    example: 90000,
    description: 'Collected against scheduled months',
  })
  collected: number;
  @ApiProperty({
    example: 92500,
    description: 'Everything that arrived in the window, including ad-hoc',
  })
  received: number;
  @ApiProperty({ example: 30000 }) outstanding: number;
  @ApiProperty({ example: 1 }) overdueCount: number;
  @ApiProperty({ example: 30000 }) overdueAmount: number;
  @ApiProperty({ example: 75, description: 'collected / scheduled, 0-100' })
  collectionRate: number;
}

/** One tenant's row: identity, totals, then a cell per month in order. */
export class MonthlyRowDto {
  @ApiProperty() leaseId: string;
  @ApiProperty() propertyId: string;

  @ApiPropertyOptional({ nullable: true }) tenantName: string | null;
  @ApiPropertyOptional({ nullable: true }) buildingName: string | null;
  @ApiPropertyOptional({ nullable: true }) unitNo: string | null;
  @ApiPropertyOptional({ nullable: true }) propertyTitle: string | null;

  @ApiProperty({ enum: RentFrequency }) paymentFrequency: RentFrequency;

  @ApiProperty({ format: 'date-time' }) leaseStart: Date;
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  leaseEnd: Date | null;
  @ApiProperty() isActive: boolean;

  @ApiProperty({
    description:
      'False when this lease has no schedule at all — show a "set up collection dates" prompt rather than an empty row.',
  })
  hasSchedule: boolean;

  @ApiProperty({ type: MonthlyRowTotalsDto }) totals: MonthlyRowTotalsDto;

  @ApiProperty({
    type: [MonthlyCellDto],
    description: 'One per month in `months`, same order. Never sparse.',
  })
  cells: MonthlyCellDto[];
}

/** A column header: the month, where it sits in time, and its totals. */
export class MonthlyColumnDto {
  @ApiProperty({ example: '2026-03' }) month: string;

  @ApiProperty({
    description:
      'Entirely in the past. Its cells are history — render the payment list.',
  })
  isPast: boolean;

  @ApiProperty({ description: 'The month we are in now' })
  isCurrent: boolean;

  @ApiProperty({
    description:
      'Still to come. Its cells are expectations — render due/not-due, and never mark them late.',
  })
  isFuture: boolean;

  @ApiProperty({ example: 90000 }) scheduled: number;
  @ApiProperty({ example: 60000 }) collected: number;
  @ApiProperty({ example: 62500 }) received: number;
  @ApiProperty({ example: 30000 }) outstanding: number;
  @ApiProperty({ example: 30000 }) overdueAmount: number;

  @ApiProperty({
    example: 3,
    description: 'Tenants with anything due this month',
  })
  dueCount: number;
  @ApiProperty({ example: 2 }) paidCount: number;
  @ApiProperty({ example: 0 }) partialCount: number;
  @ApiProperty({ example: 0 }) pendingCount: number;
  @ApiProperty({ example: 1 }) overdueCount: number;
}

/** Grand totals across every row and month in the window. */
export class MonthlyGrandTotalsDto {
  @ApiProperty({ example: 12 }) leases: number;
  @ApiProperty({ example: 480000 }) scheduled: number;
  @ApiProperty({ example: 310000 }) collected: number;
  @ApiProperty({ example: 330000 }) received: number;
  @ApiProperty({ example: 170000 }) outstanding: number;
  @ApiProperty({ example: 45000 }) overdueAmount: number;
  @ApiProperty({ example: 3 }) overdueCount: number;
  @ApiProperty({ example: 65 }) collectionRate: number;
}

/**
 * The month-by-month collection table: tenants down, months across.
 *
 * `months` is the column header row and `rows[].cells` lines up with it
 * index-for-index, so the grid renders without any client-side bucketing.
 */
export class MonthlyViewDto {
  @ApiProperty({ format: 'date-time' }) generatedAt: Date;

  @ApiProperty({
    example: {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.999Z',
    },
  })
  range: { from: Date; to: Date };

  @ApiProperty({
    type: [MonthlyColumnDto],
    description: 'Column headers, in order',
  })
  months: MonthlyColumnDto[];

  @ApiProperty({ type: [MonthlyRowDto] })
  rows: MonthlyRowDto[];

  @ApiProperty({ type: MonthlyGrandTotalsDto })
  totals: MonthlyGrandTotalsDto;
}
