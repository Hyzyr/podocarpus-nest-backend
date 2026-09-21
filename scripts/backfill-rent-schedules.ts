/**
 * Backfill rent collection schedules for leases that predate them.
 *
 * Leases created before RentInstallment existed have payments but no schedule,
 * so they report zero scheduled/collected and never appear in upcoming or
 * overdue. This generates a schedule for each and attaches the existing
 * payments to it.
 *
 *   npx tsx scripts/backfill-rent-schedules.ts                 # dry run (default)
 *   npx tsx scripts/backfill-rent-schedules.ts --apply
 *   npx tsx scripts/backfill-rent-schedules.ts --lease=<uuid> --apply
 *   npx tsx scripts/backfill-rent-schedules.ts --frequency=QUARTERLY --apply
 *   npx tsx scripts/backfill-rent-schedules.ts --active-only
 *
 * Nothing is written without --apply. The operation is reversible: it only
 * inserts RentInstallment rows and sets RentPayment.installmentId, so
 * `--undo` puts everything back. No payment amount or date is ever touched.
 */
import 'dotenv/config';
import { PrismaClient, RentFrequency } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  buildSchedule,
  COLLECTIONS_PER_YEAR,
  FREQUENCY_TO_PAYMENT_TYPE,
  round2,
} from '../src/payments/rent-schedule.util';

/* ------------------------------ arguments -------------------------------- */

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const value = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

const APPLY = has('--apply');
const UNDO = has('--undo');
const ACTIVE_ONLY = has('--active-only');
const ONLY_LEASE = value('lease');
const FORCED_FREQUENCY = value('frequency') as RentFrequency | undefined;
/**
 * Guessing the cadence from payment counts is opt-in, and deliberately not the
 * default. Getting it wrong moves due dates, and wrong due dates make the
 * dashboard chase tenants who are not actually late. ANNUAL matches what the
 * data already asserts — `annualRent` — and is the safe thing to assume until
 * somebody says otherwise.
 */
const INFER = has('--infer-frequency');
const DEFAULT_FREQUENCY =
  (value('default-frequency') as RentFrequency | undefined) ??
  RentFrequency.ANNUAL;

/** Cadences the inference may choose between, by collections per year. */
const INFERRABLE: RentFrequency[] = [
  RentFrequency.ANNUAL,
  RentFrequency.SEMI_ANNUAL,
  RentFrequency.QUARTERLY,
  RentFrequency.BI_MONTHLY,
  RentFrequency.MONTHLY,
];

const MS_PER_DAY = 86_400_000;

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new pg.Pool({ connectionString: process.env.DATABASE_URL }),
  ),
});

/* -------------------------------- main ----------------------------------- */

async function main() {
  if (UNDO) return undo();

  const leases = await prisma.tenantLease.findMany({
    where: {
      // Only leases that have no schedule at all — never touch a real one.
      installments: { none: {} },
      ...(ACTIVE_ONLY && { isActive: true }),
      ...(ONLY_LEASE && { id: ONLY_LEASE }),
    },
    include: {
      property: { select: { buildingName: true, unitNo: true, title: true } },
      payments: { orderBy: { paidDate: 'asc' } },
    },
    orderBy: [{ isActive: 'desc' }, { leaseStart: 'asc' }],
  });

  if (leases.length === 0) {
    console.log('Nothing to backfill — every matching lease already has a schedule.');
    return;
  }

  console.log(
    `${APPLY ? 'APPLYING' : 'DRY RUN'} — ${leases.length} lease(s) without a schedule\n`,
  );

  const plans = leases.map(planFor);

  console.log(
    pad('Tenant / unit', 40) +
      pad('cadence', 13) +
      pad('why', 11) +
      pad('inst', 6) +
      pad('each', 12) +
      pad('pmts', 6) +
      'matched',
  );
  console.log('-'.repeat(96));

  for (const plan of plans) {
    console.log(
      pad(plan.label, 40) +
        pad(plan.frequency, 13) +
        pad(plan.reason, 11) +
        pad(String(plan.installments.length), 6) +
        pad(money(plan.installments[0]?.amountDue ?? 0), 12) +
        pad(String(plan.payments.length), 6) +
        `${plan.matched}${plan.unmatched ? ` (${plan.unmatched} left ad-hoc)` : ''}`,
    );
  }

  const totals = plans.reduce(
    (t, p) => ({
      installments: t.installments + p.installments.length,
      scheduled: t.scheduled + p.scheduledTotal,
      payments: t.payments + p.payments.length,
      matched: t.matched + p.matched,
      unmatched: t.unmatched + p.unmatched,
    }),
    { installments: 0, scheduled: 0, payments: 0, matched: 0, unmatched: 0 },
  );

  console.log('-'.repeat(96));
  console.log(
    `${plans.length} leases · ${totals.installments} installments · ` +
      `${totals.payments} payments, ${totals.matched} matched, ${totals.unmatched} left ad-hoc`,
  );

  // Per calendar year, because the headline total spans every lease term and
  // multi-year leases make it look alarmingly large next to one year's rent.
  const perYear = new Map<number, number>();
  for (const plan of plans) {
    for (const i of plan.installments) {
      const y = i.dueDate.getUTCFullYear();
      perYear.set(y, round2((perYear.get(y) ?? 0) + i.amountDue));
    }
  }
  console.log(
    `\nScheduled per calendar year (total ${money(totals.scheduled)} spans every lease term):`,
  );
  for (const [year, amount] of [...perYear].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${year}  ${money(amount)}`);
  }

  const ambiguous = plans.filter((p) => p.ambiguous);
  if (ambiguous.length) {
    console.log(
      `\n${ambiguous.length} cadence(s) marked ?? are a coin flip — the payment rate sits exactly` +
        '\nbetween two cadences. Set them deliberately with --lease=<id> --frequency=<X>,' +
        '\nor leave them and let an admin pick in the UI.',
    );
  }

  if (totals.unmatched > 0) {
    console.log(
      `\nThe ${totals.unmatched} unmatched payment(s) stay exactly as they are — ` +
        'still counted in every total, just not attached to a due date.',
    );
  }

  if (!APPLY) {
    console.log('\nDry run. Nothing written. Re-run with --apply to commit.');
    return;
  }

  let written = 0;
  for (const plan of plans) {
    await prisma.$transaction(async (tx) => {
      await tx.rentInstallment.createMany({
        data: plan.installments.map((i) => ({
          ...i,
          tenantLeaseId: plan.leaseId,
        })),
      });

      const created = await tx.rentInstallment.findMany({
        where: { tenantLeaseId: plan.leaseId },
        orderBy: { sequence: 'asc' },
        select: { id: true, sequence: true },
      });
      const idBySequence = new Map(created.map((i) => [i.sequence, i.id]));

      for (const [paymentId, sequence] of plan.allocation) {
        await tx.rentPayment.update({
          where: { id: paymentId },
          data: { installmentId: idBySequence.get(sequence) },
        });
      }

      await tx.tenantLease.update({
        where: { id: plan.leaseId },
        data: {
          paymentFrequency: plan.frequency,
          scheduleUpdatedAt: new Date(),
        },
      });
    });

    // Derive amountPaid/status from the payments just attached.
    const installments = await prisma.rentInstallment.findMany({
      where: { tenantLeaseId: plan.leaseId },
      include: { payments: { select: { amount: true, paidDate: true } } },
    });

    for (const inst of installments) {
      const amountPaid = round2(
        inst.payments.reduce((s, p) => s + p.amount, 0),
      );
      const status =
        amountPaid >= inst.amountDue - 0.005
          ? 'PAID'
          : amountPaid > 0
            ? 'PARTIAL'
            : 'PENDING';
      const paidInFullAt =
        status === 'PAID'
          ? inst.payments.reduce<Date | null>(
              (l, p) => (!l || p.paidDate > l ? p.paidDate : l),
              null,
            )
          : null;

      await prisma.rentInstallment.update({
        where: { id: inst.id },
        data: { amountPaid, status, paidInFullAt },
      });
    }

    written++;
  }

  console.log(`\nDone. ${written} lease(s) backfilled.`);
  console.log('To reverse: npx tsx scripts/backfill-rent-schedules.ts --undo');
}

/* -------------------------------- planning -------------------------------- */

type Lease = Awaited<ReturnType<typeof loadOne>>;
async function loadOne() {
  return prisma.tenantLease.findFirstOrThrow({
    include: {
      property: { select: { buildingName: true, unitNo: true, title: true } },
      payments: { orderBy: { paidDate: 'asc' } },
    },
  });
}

function planFor(lease: Lease) {
  const { frequency, reason, ambiguous } = resolveFrequency(lease);

  const annualAmount =
    lease.annualRent ?? (lease.monthlyRent ? lease.monthlyRent * 12 : 0);

  const installments =
    annualAmount > 0
      ? buildSchedule({
          frequency: frequency as Exclude<RentFrequency, 'CUSTOM'>,
          leaseStart: lease.leaseStart,
          leaseEnd: lease.leaseEnd,
          annualAmount,
          // Anchor to the lease start; no anchorDay, so the day of month is kept.
          firstDueDate: null,
          anchorDay: null,
          count: null,
        })
      : [];

  const { allocation, matched, unmatched } = allocate(lease, installments);

  return {
    leaseId: lease.id,
    label: labelFor(lease),
    frequency,
    reason,
    ambiguous,
    installments,
    scheduledTotal: round2(installments.reduce((s, i) => s + i.amountDue, 0)),
    payments: lease.payments,
    allocation,
    matched,
    unmatched,
    paymentType: FREQUENCY_TO_PAYMENT_TYPE[frequency],
  };
}

/**
 * Pick a cadence.
 *
 * An explicit --frequency wins. Otherwise count how many payments a year the
 * tenant actually made and snap to the nearest supported cadence — a tenant who
 * paid four times a year was on a quarterly arrangement whatever anyone wrote
 * down. Falls back to the default when there is no history to learn from.
 */
function resolveFrequency(lease: Lease): {
  frequency: RentFrequency;
  reason: string;
  ambiguous: boolean;
} {
  if (FORCED_FREQUENCY) {
    return { frequency: FORCED_FREQUENCY, reason: 'forced', ambiguous: false };
  }
  if (!INFER || lease.payments.length === 0) {
    return {
      frequency: DEFAULT_FREQUENCY,
      reason: INFER ? 'no history' : 'default',
      ambiguous: false,
    };
  }

  const first = lease.payments[0].paidDate.getTime();
  const last = lease.payments.at(-1)!.paidDate.getTime();
  const span = Math.max(1, (last - first) / (365 * MS_PER_DAY));
  const perYear = lease.payments.length / span;

  const ranked = [...INFERRABLE].sort(
    (a, b) =>
      Math.abs(COLLECTIONS_PER_YEAR[a] - perYear) -
      Math.abs(COLLECTIONS_PER_YEAR[b] - perYear),
  );

  // 3 payments a year sits exactly between SEMI_ANNUAL and QUARTERLY; 5 sits
  // between QUARTERLY and BI_MONTHLY. A coin flip is not an inference, so say so
  // rather than presenting it as a finding.
  const ambiguous =
    Math.abs(COLLECTIONS_PER_YEAR[ranked[0]] - perYear) ===
    Math.abs(COLLECTIONS_PER_YEAR[ranked[1]] - perYear);

  return {
    frequency: ranked[0],
    reason: `${perYear.toFixed(1)}/yr${ambiguous ? ' ??' : ''}`,
    ambiguous,
  };
}

/**
 * Attach each existing payment to a due date.
 *
 * Standard arrears allocation: payments in date order, each applied whole to the
 * oldest installment still short of its amount. A RentPayment row holds a single
 * installmentId so a payment cannot be split across two; anything left over once
 * every installment is covered stays unattached rather than being forced
 * somewhere it does not belong.
 */
function allocate(
  lease: Lease,
  installments: { sequence: number; amountDue: number }[],
) {
  const outstanding = installments.map((i) => ({
    sequence: i.sequence,
    left: i.amountDue,
  }));
  const allocation: [string, number][] = [];
  let matched = 0;

  for (const payment of lease.payments) {
    const target = outstanding.find((o) => o.left > 0.005);
    if (!target) continue; // schedule fully covered; leave this one ad-hoc
    allocation.push([payment.id, target.sequence]);
    target.left = round2(target.left - payment.amount);
    matched++;
  }

  return { allocation, matched, unmatched: lease.payments.length - matched };
}

/* --------------------------------- undo ----------------------------------- */

/**
 * Reverse a backfill: detach every payment and delete the generated
 * installments. Payment amounts and dates are never modified, so this restores
 * the exact pre-backfill state.
 */
async function undo() {
  const where = ONLY_LEASE ? { tenantLeaseId: ONLY_LEASE } : {};
  const count = await prisma.rentInstallment.count({ where });

  if (!APPLY) {
    console.log(
      `DRY RUN — would detach payments from and delete ${count} installment(s).`,
    );
    console.log('Re-run with --undo --apply to commit.');
    return;
  }

  await prisma.rentPayment.updateMany({
    where: ONLY_LEASE ? { tenantLeaseId: ONLY_LEASE } : { NOT: { installmentId: null } },
    data: { installmentId: null },
  });
  const deleted = await prisma.rentInstallment.deleteMany({ where });
  console.log(`Undone. ${deleted.count} installment(s) removed, payments detached.`);
}

/* -------------------------------- helpers --------------------------------- */

const pad = (s: string, n: number) => String(s).padEnd(n);
const money = (n: number) => n.toLocaleString('en-AE', { maximumFractionDigits: 0 });

function labelFor(lease: Lease) {
  const bits = [
    lease.tenantName,
    lease.property.unitNo && `#${lease.property.unitNo}`,
    lease.property.buildingName,
  ].filter(Boolean);
  const label = ((lease.isActive ? '' : '(ended) ') + (bits.join(' · ') || lease.property.title));
  return label.length > 38 ? label.slice(0, 37) + '…' : label;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
