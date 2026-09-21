import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstallmentStatus, Prisma, RentFrequency } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { ApiErrorCode } from 'src/common/http/api-error';
import { paginated } from 'src/common/http/api-response.dto';
import {
  CollectInstallmentDto,
  CustomInstallmentDto,
  GenerateScheduleDto,
  InstallmentQueryDto,
  UpdateInstallmentDto,
} from '../dto/rent-schedule.dto';
import {
  LeaseScheduleDto,
  RentInstallmentDto,
} from '../dto/rent-schedule.response.dto';
import {
  buildSchedule,
  inferFrequency,
  MAX_INSTALLMENTS,
  PAID_EPSILON,
  paymentTypeForPeriod,
  round2,
} from '../rent-schedule.util';

/** Statuses an admin may set by hand. PAID/PARTIAL are derived from payments. */
const MANUALLY_SETTABLE: InstallmentStatus[] = [
  InstallmentStatus.PENDING,
  InstallmentStatus.WAIVED,
  InstallmentStatus.CANCELLED,
];

/** Statuses that still expect money. Everything else is closed. */
export const OPEN_STATUSES: InstallmentStatus[] = [
  InstallmentStatus.PENDING,
  InstallmentStatus.PARTIAL,
];

/** Statuses that count toward "scheduled" money. Waived/cancelled do not. */
export const BILLABLE_STATUSES: InstallmentStatus[] = [
  InstallmentStatus.PENDING,
  InstallmentStatus.PARTIAL,
  InstallmentStatus.PAID,
];

const MS_PER_DAY = 86_400_000;

const LEASE_CONTEXT_SELECT = {
  id: true,
  propertyId: true,
  tenantName: true,
  property: { select: { buildingName: true, unitNo: true, title: true } },
} as const;

/**
 * Owns the rent collection schedule: turning a lease's cadence into concrete
 * due dates, editing them, and accepting money against them.
 *
 * The schedule is rows in `RentInstallment` rather than a JSON array of dates
 * on the lease, because each date needs its own amount, status, note and
 * payment history, and because "what is due across every property this month"
 * has to be one indexed query.
 */
@Injectable()
export class RentScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------------------------------------------------- */
  /*  Schedule generation                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Build or rebuild a lease's schedule.
   *
   * Regenerating a schedule that already has money against it needs
   * `force: true`; those payments survive but lose their installment link and
   * become ad-hoc collections.
   */
  async generate(
    leaseId: string,
    dto: GenerateScheduleDto,
  ): Promise<LeaseScheduleDto> {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id: leaseId },
      include: { installments: { select: { id: true, amountPaid: true } } },
    });
    if (!lease) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Tenant lease with ID ${leaseId} not found`,
      });
    }

    const collected = lease.installments.some((i) => i.amountPaid > 0);
    if (collected && !dto.force) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message:
          'This schedule already has payments recorded against it. Re-send with force: true to replace it — the payments are kept but are no longer linked to a scheduled date.',
      });
    }

    const rows = this.planRows(dto, lease);

    await this.prisma.$transaction([
      this.prisma.rentInstallment.deleteMany({
        where: { tenantLeaseId: leaseId },
      }),
      this.prisma.rentInstallment.createMany({
        data: rows.map((r) => ({ ...r, tenantLeaseId: leaseId })),
      }),
      this.prisma.tenantLease.update({
        where: { id: leaseId },
        data: { scheduleUpdatedAt: new Date() },
      }),
    ]);

    return this.getSchedule(leaseId);
  }

  /**
   * Schedule rows for a lease that is being created in the same request.
   *
   * Returns `Prisma.RentInstallmentCreateWithoutTenantLeaseInput[]` so the
   * caller can nest it and keep lease + schedule in one transaction.
   */
  planForNewLease(
    dto: GenerateScheduleDto,
    lease: {
      leaseStart: Date;
      leaseEnd?: Date | null;
      annualRent?: number | null;
    },
  ): Prisma.RentInstallmentCreateWithoutTenantLeaseInput[] {
    return this.planRows(dto, lease);
  }

  /** Shared planner for both entry points. */
  private planRows(
    dto: GenerateScheduleDto,
    lease: {
      leaseStart: Date;
      leaseEnd?: Date | null;
      annualRent?: number | null;
    },
  ): Prisma.RentInstallmentCreateWithoutTenantLeaseInput[] {
    if (dto.frequency === RentFrequency.CUSTOM) {
      return this.planCustom(dto.installments);
    }

    const annualAmount = dto.annualAmount ?? lease.annualRent;

    if (!annualAmount || annualAmount <= 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message:
          'Cannot work out how much to collect. Set annualAmount on the request, or annualRent on the lease.',
      });
    }

    const planned = buildSchedule({
      frequency: dto.frequency,
      leaseStart: lease.leaseStart,
      leaseEnd: lease.leaseEnd ?? null,
      annualAmount,
      firstDueDate: dto.firstDueDate ? new Date(dto.firstDueDate) : null,
      anchorDay: dto.anchorDay ?? null,
      count: dto.count ?? null,
    });

    if (planned.length === 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message:
          'That produced no collection dates — the first due date is after the lease end date.',
      });
    }

    return planned;
  }

  /** Validate and normalise hand-entered dates. */
  private planCustom(
    installments?: CustomInstallmentDto[],
  ): Prisma.RentInstallmentCreateWithoutTenantLeaseInput[] {
    if (!installments?.length) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'frequency CUSTOM requires a non-empty installments array.',
      });
    }
    if (installments.length > MAX_INSTALLMENTS) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `A schedule may hold at most ${MAX_INSTALLMENTS} installments.`,
      });
    }

    return [...installments]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((i, idx) => ({
        sequence: idx + 1,
        dueDate: new Date(i.dueDate),
        amountDue: round2(i.amountDue),
        periodStart: i.periodStart ? new Date(i.periodStart) : null,
        periodEnd: i.periodEnd ? new Date(i.periodEnd) : null,
        note: i.note ?? null,
      }));
  }

  /* ---------------------------------------------------------------------- */
  /*  Reads                                                                  */
  /* ---------------------------------------------------------------------- */

  /** One lease's full schedule with its roll-up. */
  async getSchedule(leaseId: string): Promise<LeaseScheduleDto> {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id: leaseId },
      include: {
        installments: {
          orderBy: [{ dueDate: 'asc' }, { sequence: 'asc' }],
          include: { payments: { orderBy: { paidDate: 'asc' } } },
        },
      },
    });
    if (!lease) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Tenant lease with ID ${leaseId} not found`,
      });
    }

    const now = new Date();
    const installments = lease.installments.map((i) => decorate(i, now));

    const billable = installments.filter((i) =>
      BILLABLE_STATUSES.includes(i.status),
    );
    const overdue = installments.filter((i) => i.isOverdue);

    const totalScheduled = round2(
      billable.reduce((s, i) => s + i.amountDue, 0),
    );
    const totalCollected = round2(
      installments.reduce((s, i) => s + i.amountPaid, 0),
    );

    return {
      leaseId: lease.id,
      propertyId: lease.propertyId,
      tenantName: lease.tenantName,
      paymentFrequency: inferFrequency(
        lease.installments.map((i) => i.dueDate),
      ),
      scheduleUpdatedAt: lease.scheduleUpdatedAt,
      summary: {
        installmentCount: installments.length,
        totalScheduled,
        totalCollected,
        totalOutstanding: round2(Math.max(0, totalScheduled - totalCollected)),
        overdueCount: overdue.length,
        overdueAmount: round2(overdue.reduce((s, i) => s + i.balance, 0)),
        collectionRate:
          totalScheduled > 0
            ? Math.round((totalCollected / totalScheduled) * 100)
            : 0,
        nextDue:
          installments.find((i) => OPEN_STATUSES.includes(i.status)) ?? null,
      },
      installments,
    };
  }

  /** Cross-lease installment list — the dashboard's drill-down. */
  async listInstallments(query: InstallmentQueryDto) {
    const limit = Math.min(query.limit ?? 50, 100);
    const offset = query.offset ?? 0;
    const where = this.buildWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.rentInstallment.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }],
        take: limit,
        skip: offset,
        include: {
          payments: { orderBy: { paidDate: 'asc' } },
          tenantLease: { select: LEASE_CONTEXT_SELECT },
        },
      }),
      this.prisma.rentInstallment.count({ where }),
    ]);

    const now = new Date();
    return paginated(
      rows.map((r) => decorate(r, now)),
      total,
      limit,
      offset,
    );
  }

  /** Single installment with its payments and lease context. */
  async findInstallment(id: string): Promise<RentInstallmentDto> {
    const row = await this.prisma.rentInstallment.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paidDate: 'asc' } },
        tenantLease: { select: LEASE_CONTEXT_SELECT },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Installment with ID ${id} not found`,
      });
    }
    return decorate(row, new Date());
  }

  /** Translate query filters into a Prisma `where`. */
  private buildWhere(
    query: InstallmentQueryDto,
  ): Prisma.RentInstallmentWhereInput {
    const where: Prisma.RentInstallmentWhereInput = {};

    if (query.leaseId) where.tenantLeaseId = query.leaseId;
    if (query.propertyId) {
      where.tenantLease = { propertyId: query.propertyId };
    }
    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      where.dueDate = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    // "Overdue" is derived, never stored, so it cannot go stale.
    if (query.overdueOnly) {
      where.status = { in: OPEN_STATUSES };
      where.dueDate = { ...(where.dueDate as object), lt: new Date() };
    }

    return where;
  }

  /* ---------------------------------------------------------------------- */
  /*  Writes                                                                 */
  /* ---------------------------------------------------------------------- */

  /** Append one extra collection date to an existing schedule. */
  async addInstallment(
    leaseId: string,
    dto: CustomInstallmentDto,
  ): Promise<RentInstallmentDto> {
    const lease = await this.prisma.tenantLease.findUnique({
      where: { id: leaseId },
      select: { id: true },
    });
    if (!lease) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Tenant lease with ID ${leaseId} not found`,
      });
    }

    const last = await this.prisma.rentInstallment.findFirst({
      where: { tenantLeaseId: leaseId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const created = await this.prisma.rentInstallment.create({
      data: {
        tenantLeaseId: leaseId,
        sequence: (last?.sequence ?? 0) + 1,
        dueDate: new Date(dto.dueDate),
        amountDue: round2(dto.amountDue),
        periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        note: dto.note ?? null,
      },
      include: { payments: true },
    });

    await this.touchLease(leaseId);
    return decorate(created, new Date());
  }

  /** Move, reprice, annotate, waive or cancel one collection. */
  async updateInstallment(
    id: string,
    dto: UpdateInstallmentDto,
  ): Promise<RentInstallmentDto> {
    const existing = await this.prisma.rentInstallment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Installment with ID ${id} not found`,
      });
    }

    if (dto.status && !MANUALLY_SETTABLE.includes(dto.status)) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `status ${dto.status} is derived from recorded payments and cannot be set directly. Allowed: ${MANUALLY_SETTABLE.join(', ')}.`,
      });
    }

    await this.prisma.rentInstallment.update({
      where: { id },
      data: {
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.amountDue !== undefined && {
          amountDue: round2(dto.amountDue),
        }),
        ...(dto.periodStart !== undefined && {
          periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        }),
        ...(dto.periodEnd !== undefined && {
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.status && { status: dto.status }),
      },
    });

    // Repricing or un-waiving can change what the payments add up to.
    await this.recompute(id);
    await this.touchLease(existing.tenantLeaseId);
    return this.findInstallment(id);
  }

  /**
   * Drop a scheduled collection.
   *
   * Any payments against it are kept — they become ad-hoc collections — so
   * deleting a line from the schedule never destroys a money record.
   */
  async removeInstallment(id: string) {
    const existing = await this.prisma.rentInstallment.findUnique({
      where: { id },
      select: {
        id: true,
        tenantLeaseId: true,
        _count: { select: { payments: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Installment with ID ${id} not found`,
      });
    }

    await this.prisma.rentInstallment.delete({ where: { id } });
    await this.touchLease(existing.tenantLeaseId);

    return {
      success: true,
      message:
        existing._count.payments > 0
          ? `Installment removed. ${existing._count.payments} payment(s) were kept and are now unscheduled.`
          : 'Installment removed',
    };
  }

  /**
   * Accept money against a scheduled collection.
   *
   * Defaults the amount to the outstanding balance, so the common
   * "tenant paid what they owed" case is a body-less POST.
   */
  async collect(
    installmentId: string,
    dto: CollectInstallmentDto,
    recordedById?: string,
  ) {
    const installment = await this.prisma.rentInstallment.findUnique({
      where: { id: installmentId },
      include: {
        tenantLease: { select: { id: true } },
      },
    });
    if (!installment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Installment with ID ${installmentId} not found`,
      });
    }
    if (installment.status === InstallmentStatus.CANCELLED) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: 'This installment is cancelled. Reopen it before collecting.',
      });
    }

    const balance = round2(installment.amountDue - installment.amountPaid);
    const amount = dto.amount ?? balance;

    if (amount <= 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message:
          balance <= 0
            ? 'This installment is already settled. Pass an explicit amount to record an extra payment.'
            : 'amount must be greater than 0.',
      });
    }

    const payment = await this.prisma.rentPayment.create({
      data: {
        tenantLeaseId: installment.tenantLeaseId,
        installmentId: installment.id,
        amount: round2(amount),
        paidDate: dto.paidDate ? new Date(dto.paidDate) : new Date(),
        type:
          dto.type ??
          paymentTypeForPeriod(installment.periodStart, installment.periodEnd),
        method: dto.method ?? null,
        reference: dto.reference ?? null,
        note: dto.note ?? null,
        recordedById,
      },
    });

    await this.recompute(installment.id);

    return { payment, installment: await this.findInstallment(installment.id) };
  }

  /* ---------------------------------------------------------------------- */
  /*  Derived state                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Re-derive `amountPaid` and `status` from the payments on an installment.
   *
   * Called after every write that can move money — collect, and the generic
   * payment create/update/delete in `PaymentsService`.
   *
   * `WAIVED` and `CANCELLED` are admin decisions, so the total is refreshed
   * but the status is left alone.
   */
  async recompute(installmentId: string): Promise<void> {
    const installment = await this.prisma.rentInstallment.findUnique({
      where: { id: installmentId },
      include: { payments: { select: { amount: true, paidDate: true } } },
    });
    if (!installment) return;

    const amountPaid = round2(
      installment.payments.reduce((s, p) => s + p.amount, 0),
    );

    const sticky =
      installment.status === InstallmentStatus.WAIVED ||
      installment.status === InstallmentStatus.CANCELLED;

    const status = sticky
      ? installment.status
      : amountPaid >= installment.amountDue - PAID_EPSILON
        ? InstallmentStatus.PAID
        : amountPaid > 0
          ? InstallmentStatus.PARTIAL
          : InstallmentStatus.PENDING;

    const paidInFullAt =
      status === InstallmentStatus.PAID
        ? (installment.paidInFullAt ??
          installment.payments.reduce<Date | null>(
            (latest, p) =>
              !latest || p.paidDate > latest ? p.paidDate : latest,
            null,
          ))
        : null;

    await this.prisma.rentInstallment.update({
      where: { id: installmentId },
      data: { amountPaid, status, paidInFullAt },
    });
  }

  /** Stamp the lease so the admin UI can show when the schedule last moved. */
  private async touchLease(leaseId: string): Promise<void> {
    await this.prisma.tenantLease.update({
      where: { id: leaseId },
      data: { scheduleUpdatedAt: new Date() },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Shaping                                                                    */
/* -------------------------------------------------------------------------- */

type InstallmentRow = Prisma.RentInstallmentGetPayload<{
  include: { payments: true };
}> & {
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

/**
 * Add the read-time fields — balance and overdue-ness — that are derived
 * rather than stored.
 */
export function decorate(
  row: InstallmentRow,
  now: Date = new Date(),
): RentInstallmentDto {
  const open = OPEN_STATUSES.includes(row.status);
  const balance = open
    ? round2(Math.max(0, row.amountDue - row.amountPaid))
    : 0;
  const isOverdue = open && row.dueDate < now && balance > 0;

  const { tenantLease, ...installment } = row;

  return {
    ...installment,
    balance,
    isOverdue,
    daysOverdue: isOverdue
      ? Math.floor((now.getTime() - row.dueDate.getTime()) / MS_PER_DAY)
      : 0,
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
