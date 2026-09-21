import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstallmentStatus, PaymentType, RentFrequency } from '@prisma/client';

/**
 * Typed response for `GET /payments/collection-tracker`.
 *
 * This endpoint predates the schedule work and its live shape was never
 * described in Swagger — the frontend had to hand-write types for it. The
 * shape here matches `PaymentsService.getCollectionTracker` exactly; do not
 * change one without the other.
 */

/** Slim installment as embedded in a tracker row (subset of RentInstallmentDto). */
export class TrackerInstallmentDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 2 }) sequence: number;
  @ApiProperty({ format: 'date-time' }) dueDate: Date;
  @ApiProperty({ example: 30000 }) amountDue: number;
  @ApiProperty({ example: 30000 }) amountPaid: number;
  @ApiProperty({ enum: InstallmentStatus }) status: InstallmentStatus;
}

/** Slim payment as embedded in a tracker row. */
export class TrackerPaymentDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 30000 }) amount: number;
  @ApiProperty({ format: 'date-time' }) paidDate: Date;
  @ApiProperty({ enum: PaymentType }) type: PaymentType;
  @ApiPropertyOptional({ nullable: true }) note: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Scheduled date this settles. Null = ad-hoc.',
  })
  installmentId: string | null;
}

/**
 * One property's collection row for the year.
 *
 * A vacant property still gets a row; every tenant-dependent field is then
 * null and `collected` is 0.
 */
export class TrackerRowDto {
  @ApiProperty() propertyId: string;
  @ApiPropertyOptional({ nullable: true }) building: string | null;
  @ApiPropertyOptional({ nullable: true }) unit: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null when the property is vacant.',
  })
  tenant: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 120000,
    description:
      'Expected for the year. From the schedule when one exists (sum of the year’s billable installments), else the lease annualRent, else monthlyRent × 12. Null when vacant.',
  })
  annualRent: number | null;

  @ApiProperty({ example: 60000, description: 'Received this calendar year' })
  collected: number;

  @ApiPropertyOptional({ nullable: true, example: 60000 })
  remaining: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 50,
    description:
      'collected / annualRent as an integer percentage. Null when vacant.',
  })
  percent: number | null;

  @ApiPropertyOptional({
    nullable: true,
    enum: ['ANNUAL', 'MONTHLY'],
    description:
      'Legacy display hint: ANNUAL when the lease has annualRent set, else MONTHLY. Prefer `frequency`.',
  })
  type: 'ANNUAL' | 'MONTHLY' | null;

  @ApiPropertyOptional({
    nullable: true,
    enum: RentFrequency,
    description:
      'The lease payment cadence. Note: reads ANNUAL (the column default) even for leases nobody configured — use `scheduled` to tell a configured lease from a legacy one.',
  })
  frequency: RentFrequency | null;

  @ApiProperty({
    description:
      'True when the lease has a generated schedule for this year. False = legacy lease on the annualRent fallback — a good place for a "set up collection dates" CTA.',
  })
  scheduled: boolean;

  @ApiProperty({
    example: 1,
    description: 'Unsettled installments past their due date, evaluated now',
  })
  overdueCount: number;

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    description:
      'Soonest unsettled due date from now. Null when none or unscheduled.',
  })
  nextDueDate: Date | null;

  @ApiProperty({
    type: [TrackerInstallmentDto],
    description:
      'This year’s scheduled collections. Empty for legacy/vacant rows.',
  })
  installments: TrackerInstallmentDto[];

  @ApiProperty({
    type: [TrackerPaymentDto],
    description: 'Payments received this calendar year, oldest first.',
  })
  payments: TrackerPaymentDto[];
}

export class TrackerSummaryDto {
  @ApiProperty({ example: 29 }) totalProperties: number;
  @ApiProperty({ example: 25 }) occupied: number;
  @ApiProperty({ example: 4 }) vacant: number;
  @ApiProperty({ example: 4772582 }) totalAnnualRent: number;
  @ApiProperty({ example: 1966275.46 }) totalCollected: number;
  @ApiProperty({ example: 2806306.54 }) totalRemaining: number;
  @ApiProperty({ example: 41, description: 'Integer percentage' })
  collectionRate: number;
}

export class CollectionTrackerDto {
  @ApiProperty({ example: 2026 }) year: number;
  @ApiProperty({ type: TrackerSummaryDto }) summary: TrackerSummaryDto;
  @ApiProperty({
    type: [TrackerRowDto],
    description: 'One row per enabled property, ordered by building then unit.',
  })
  properties: TrackerRowDto[];
}
