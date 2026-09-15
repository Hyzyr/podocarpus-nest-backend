import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstallmentStatus, PaymentType, RentFrequency } from '@prisma/client';

/* -------------------------------------------------------------------------- */
/*  Responses                                                                  */
/* -------------------------------------------------------------------------- */

/** Property/lease identity carried alongside an installment in flat lists. */
export class InstallmentContextDto {
  @ApiProperty() leaseId: string;
  @ApiProperty() propertyId: string;
  @ApiPropertyOptional({ nullable: true }) tenantName: string | null;
  @ApiPropertyOptional({ nullable: true }) buildingName: string | null;
  @ApiPropertyOptional({ nullable: true }) unitNo: string | null;
  @ApiPropertyOptional({ nullable: true }) propertyTitle: string | null;
}

/** A recorded payment. */
export class RentPaymentDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantLeaseId: string;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'The scheduled collection this settles. Null for ad-hoc payments.',
  })
  installmentId: string | null;

  @ApiProperty({ example: 30000 }) amount: number;
  @ApiProperty({ format: 'date-time' }) paidDate: Date;
  @ApiProperty({ enum: PaymentType }) type: PaymentType;

  @ApiPropertyOptional({ nullable: true }) method: string | null;
  @ApiPropertyOptional({ nullable: true }) reference: string | null;
  @ApiPropertyOptional({ nullable: true }) note: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Admin who entered the payment.',
  })
  recordedById: string | null;

  @ApiPropertyOptional({
    type: InstallmentContextDto,
    description: 'Lease/property identity. Present on cross-lease lists only.',
  })
  context?: InstallmentContextDto;

  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}

/**
 * A scheduled collection, plus the fields the dashboard derives on read.
 *
 * `isOverdue` and `daysOverdue` are computed per request rather than stored,
 * so they can never be stale.
 */
export class RentInstallmentDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantLeaseId: string;

  @ApiProperty({ example: 2, description: '1-based position in the schedule' })
  sequence: number;

  @ApiProperty({ format: 'date-time' }) dueDate: Date;
  @ApiProperty({ example: 30000 }) amountDue: number;
  @ApiProperty({ example: 30000, description: 'Sum of payments received' })
  amountPaid: number;

  @ApiProperty({
    example: 0,
    description: 'amountDue - amountPaid, floored at 0. Zero once WAIVED.',
  })
  balance: number;

  @ApiProperty({ enum: InstallmentStatus }) status: InstallmentStatus;

  @ApiProperty({
    description: 'Unsettled and past its due date, evaluated now.',
  })
  isOverdue: boolean;

  @ApiProperty({ example: 0, description: 'Days past due, 0 when not overdue' })
  daysOverdue: number;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  periodStart: Date | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  periodEnd: Date | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  paidInFullAt: Date | null;

  @ApiPropertyOptional({ nullable: true }) note: string | null;

  @ApiPropertyOptional({
    type: [RentPaymentDto],
    description: 'Payments recorded against this installment.',
  })
  payments?: RentPaymentDto[];

  @ApiPropertyOptional({
    type: InstallmentContextDto,
    description: 'Lease/property identity. Present on cross-lease lists only.',
  })
  context?: InstallmentContextDto;

  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
}

/** Roll-up of one lease's schedule. */
export class LeaseScheduleSummaryDto {
  @ApiProperty({ example: 4 }) installmentCount: number;
  @ApiProperty({
    example: 120000,
    description: 'Sum of amountDue, excluding WAIVED/CANCELLED',
  })
  totalScheduled: number;
  @ApiProperty({ example: 60000 }) totalCollected: number;
  @ApiProperty({ example: 60000 }) totalOutstanding: number;
  @ApiProperty({ example: 1 }) overdueCount: number;
  @ApiProperty({ example: 30000 }) overdueAmount: number;
  @ApiProperty({
    example: 50,
    description: 'Collected / scheduled, as a percentage',
  })
  collectionRate: number;

  @ApiPropertyOptional({
    type: RentInstallmentDto,
    nullable: true,
    description: 'Soonest unsettled collection, or null when all are settled.',
  })
  nextDue: RentInstallmentDto | null;
}

/** The full collection schedule for one lease. */
export class LeaseScheduleDto {
  @ApiProperty() leaseId: string;
  @ApiProperty() propertyId: string;
  @ApiPropertyOptional({ nullable: true }) tenantName: string | null;

  @ApiProperty({ enum: RentFrequency }) paymentFrequency: RentFrequency;

  @ApiPropertyOptional({ nullable: true, example: 1 })
  paymentAnchorDay: number | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  scheduleUpdatedAt: Date | null;

  @ApiProperty({ type: LeaseScheduleSummaryDto })
  summary: LeaseScheduleSummaryDto;

  @ApiProperty({ type: [RentInstallmentDto] })
  installments: RentInstallmentDto[];
}

/** What `POST /payments/installments/:id/collect` returns. */
export class CollectResultDto {
  @ApiProperty({ type: RentPaymentDto }) payment: RentPaymentDto;
  @ApiProperty({ type: RentInstallmentDto }) installment: RentInstallmentDto;
}

/* ------------------------------- dashboard -------------------------------- */

export class DashboardTotalsDto {
  @ApiProperty({
    example: 480000,
    description: 'Sum of amountDue falling in the window',
  })
  scheduled: number;

  @ApiProperty({ example: 310000, description: 'Money received in the window' })
  collected: number;

  @ApiProperty({
    example: 290000,
    description: 'Received against scheduled installments',
  })
  collectedScheduled: number;

  @ApiProperty({
    example: 20000,
    description: 'Received with no installment attached',
  })
  collectedAdHoc: number;

  @ApiProperty({
    example: 170000,
    description: 'Scheduled minus collected, floored at 0',
  })
  outstanding: number;

  @ApiProperty({ example: 45000 }) overdueAmount: number;
  @ApiProperty({ example: 3 }) overdueCount: number;
  @ApiProperty({ example: 125000 }) upcomingAmount: number;
  @ApiProperty({ example: 6 }) upcomingCount: number;

  @ApiProperty({
    example: 65,
    description: 'collected / scheduled, as a percentage',
  })
  collectionRate: number;
}

export class DashboardStatusBreakdownDto {
  @ApiProperty({ example: 12 }) PENDING: number;
  @ApiProperty({ example: 2 }) PARTIAL: number;
  @ApiProperty({ example: 18 }) PAID: number;
  @ApiProperty({ example: 1 }) WAIVED: number;
  @ApiProperty({ example: 0 }) CANCELLED: number;
}

export class DashboardMonthPointDto {
  @ApiProperty({ example: '2026-03' }) month: string;
  @ApiProperty({ example: 40000 }) scheduled: number;
  @ApiProperty({ example: 40000 }) collected: number;
}

export class PaymentsDashboardDto {
  @ApiProperty({ format: 'date-time' }) generatedAt: Date;

  @ApiProperty({
    example: {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.999Z',
    },
    description: 'The window the totals cover.',
  })
  range: { from: Date; to: Date };

  @ApiProperty({ type: DashboardTotalsDto }) totals: DashboardTotalsDto;

  @ApiProperty({ type: DashboardStatusBreakdownDto })
  byStatus: DashboardStatusBreakdownDto;

  @ApiProperty({
    type: [DashboardMonthPointDto],
    description: 'Scheduled vs collected per month, for the chart.',
  })
  monthly: DashboardMonthPointDto[];

  @ApiProperty({
    type: [RentInstallmentDto],
    description: 'Soonest unsettled collections inside the upcoming window.',
  })
  upcoming: RentInstallmentDto[];

  @ApiProperty({
    type: [RentInstallmentDto],
    description:
      'Unsettled collections already past their due date, oldest first.',
  })
  overdue: RentInstallmentDto[];

  @ApiProperty({
    type: [RentPaymentDto],
    description: 'Most recently received payments.',
  })
  recentPayments: RentPaymentDto[];
}
