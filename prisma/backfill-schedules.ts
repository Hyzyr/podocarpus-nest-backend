/**
 * Backfill rent collection schedules for leases that never got one.
 *
 * Safe to run against production:
 *   - it only ever ADDS installment rows to leases that have none;
 *   - it never deletes, edits or invents a payment — it only links existing
 *     payments to the installments they settle;
 *   - re-running it is a no-op, so it can be run after every import.
 *
 * Usage (from the repo root, with DATABASE_URL pointing at the target DB):
 *   npx tsx prisma/backfill-schedules.ts --dry     # preview, writes nothing
 *   npx tsx prisma/backfill-schedules.ts           # apply to active leases
 *   npx tsx prisma/backfill-schedules.ts --all     # include ended/inactive leases
 *
 * The cadence for each lease is inferred from its own payment history; an
 * admin can always overwrite it afterwards with PUT /api/tenant-leases/{id}/schedule.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { backfillLease, inferCadence } from './schedule-tools';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

async function main() {
  console.log(
    `🗓️  Backfilling collection schedules${DRY ? ' (DRY RUN — no writes)' : ''}` +
      `${ALL ? ' — including inactive leases' : ' — active leases only'}\n`,
  );

  const leases = await prisma.tenantLease.findMany({
    where: {
      ...(ALL ? {} : { isActive: true }),
      installments: { none: {} },
    },
    select: {
      id: true,
      tenantName: true,
      leaseStart: true,
      leaseEnd: true,
      annualRent: true,
      payments: { select: { paidDate: true } },
    },
    orderBy: { leaseStart: 'asc' },
  });

  if (leases.length === 0) {
    console.log('✅ Nothing to do — every lease already has a schedule.');
    return;
  }

  console.log(`Found ${leases.length} lease(s) without a schedule:\n`);

  let installments = 0;
  let linked = 0;
  let skipped = 0;

  for (const lease of leases) {
    const paidDates = lease.payments.map((p) => p.paidDate);

    if (DRY) {
      // Report the decision without writing anything.
      const cadence = inferCadence(lease, paidDates);
      console.log(
        `  would schedule ${(lease.tenantName ?? '—').slice(0, 28).padEnd(28)} ` +
          `${cadence.padEnd(12)} (${lease.payments.length} existing payment(s))`,
      );
      continue;
    }

    const result = await prisma.$transaction(
      (tx) => backfillLease(tx, lease, paidDates),
      { timeout: 30_000 },
    );

    if (!result) {
      skipped++;
      console.warn(
        `  ⚠️  ${(lease.tenantName ?? '—').slice(0, 28)} — no dates produced ` +
          `(check leaseStart/leaseEnd), skipped`,
      );
      continue;
    }

    installments += result.installments;
    linked += result.linkedPayments;
    console.log(
      `  ✅ ${(result.tenantName ?? '—').slice(0, 28).padEnd(28)} ` +
        `${result.cadence.padEnd(12)} ${String(result.installments).padStart(3)} installments, ` +
        `${result.linkedPayments} payment(s) linked`,
    );
  }

  if (DRY) {
    console.log(`\nDry run complete — ${leases.length} lease(s) would be scheduled.`);
    return;
  }

  console.log(
    `\n✅ Done: ${installments} installments created across ` +
      `${leases.length - skipped} lease(s), ${linked} existing payment(s) linked.` +
      (skipped ? ` ${skipped} skipped.` : ''),
  );
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
