/**
 * Demo-only: make the rent collection views look like a live portfolio.
 *
 * ⚠️  NEVER run this against production — it invents payments and renews
 * leases. It refuses to run when NODE_ENV=production unless --force is given.
 *
 * The seeded leases were written around 2025, so by the time you look at them
 * every term has expired and nothing is ever "upcoming". This script fixes
 * both halves of that:
 *
 *   1. renews any active lease whose term has run out, extending its schedule
 *      forward at the same cadence (nothing is deleted — installments are
 *      appended, so existing payments keep their links);
 *   2. settles past-due installments according to a per-lease profile, so the
 *      portfolio shows a realistic mix of fully-collected, part-paid, overdue
 *      and never-paid tenants instead of one uniform state.
 *
 * Deterministic: profiles are handed out round-robin by lease order, so the
 * portfolio always shows the same designed mix (40% current, 20% part-paid,
 * 20% behind, 20% sporadic). Payments it creates are tagged `reference: DEMO`,
 * and a lease that already has one is left alone — so re-running is a no-op
 * rather than piling extra money onto part-paid tenants.
 *
 * Usage:
 *   npx tsx prisma/demo-payments.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  buildSchedule,
  COLLECTIONS_PER_YEAR,
  inferFrequency,
  PAID_EPSILON,
  round2,
} from '../src/payments/rent-schedule.util';
import { collectInstallment, recomputeLease } from './schedule-tools';
import { RentFrequency } from '@prisma/client';


const FORCE = process.argv.includes('--force');

/** Marks payments this script invented, so a re-run can recognise its own work. */
const DEMO_REF = 'DEMO';

/** How far past today a renewed lease should run, so "upcoming" is never empty. */
const RENEW_MONTHS = 14;

/**
 * Collection profiles, chosen per lease so the portfolio is not uniform.
 * The weights are what a decent-but-not-perfect portfolio looks like.
 */
type Profile = 'current' | 'partial' | 'overdue' | 'sporadic';
const PROFILES: Profile[] = [
  'current',
  'current',
  'current',
  'current',
  'partial',
  'partial',
  'overdue',
  'overdue',
  'sporadic',
  'sporadic',
];

/** Stable pseudo-random 0..n-1 from a lease id, so runs are reproducible. */
function hashPick(id: string, n: number, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return Math.abs(h) % n;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Bring every active lease up to date: renew expired terms, extend schedules
 * past today, and settle history per profile. Safe to call repeatedly.
 */
export async function enrichDemoData(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  console.log(`🎭 Demo data pass — today is ${now.toISOString().slice(0, 10)}\n`);

  const leases = await prisma.tenantLease.findMany({
    where: { isActive: true },
    select: {
      id: true,
      tenantName: true,
      leaseStart: true,
      leaseEnd: true,
      annualRent: true,
    },
    orderBy: { leaseStart: 'asc' },
  });

  let renewed = 0;
  let appended = 0;
  let collected = 0;
  let collectedAed = 0;
  const profileCounts: Record<Profile, number> = {
    current: 0,
    partial: 0,
    overdue: 0,
    sporadic: 0,
  };

  const admin = await prisma.appUser.findFirst({
    where: { role: 'superadmin' },
    select: { id: true },
  });

  for (const [index, lease] of leases.entries()) {
    const existing = await prisma.rentInstallment.findMany({
      where: { tenantLeaseId: lease.id },
      orderBy: { dueDate: 'asc' },
    });
    if (existing.length === 0) continue; // no schedule — run backfill-schedules first

    // ── 1. renew leases whose term has run out ────────────────────────────
    const lastDue = existing[existing.length - 1].dueDate;
    const horizon = addMonths(now, RENEW_MONTHS);

    if (lastDue < horizon) {
      const cadence = inferFrequency(existing.map((i) => i.dueDate));
      const freq =
        cadence && cadence !== RentFrequency.CUSTOM
          ? cadence
          : RentFrequency.QUARTERLY;
      const perYear = COLLECTIONS_PER_YEAR[freq];
      const stepMonths = 12 / perYear;

      // Continue the cadence from the last date we already have.
      const firstNew = addMonths(lastDue, stepMonths);
      const monthsToCover =
        (horizon.getUTCFullYear() - firstNew.getUTCFullYear()) * 12 +
        (horizon.getUTCMonth() - firstNew.getUTCMonth());
      // +2 so the last generated date lands PAST the horizon rather than a few
      // days short of it — otherwise a second run would be needed to converge.
      const count = Math.max(1, Math.ceil(monthsToCover / stepMonths) + 2);

      const planned = buildSchedule({
        frequency: freq as Exclude<RentFrequency, 'CUSTOM'>,
        leaseStart: lease.leaseStart,
        leaseEnd: null,
        annualAmount: lease.annualRent,
        firstDueDate: firstNew,
        count,
      });

      if (planned.length > 0) {
        await prisma.rentInstallment.createMany({
          data: planned.map((p, idx) => ({
            ...p,
            sequence: existing.length + idx + 1,
            tenantLeaseId: lease.id,
          })),
        });
        appended += planned.length;

        const newEnd = planned[planned.length - 1].periodEnd;
        if (!lease.leaseEnd || lease.leaseEnd < newEnd) {
          await prisma.tenantLease.update({
            where: { id: lease.id },
            data: { leaseEnd: newEnd, scheduleUpdatedAt: new Date() },
          });
          renewed++;
        }
      }
    }

    // ── 2. settle history according to this lease's profile ───────────────
    // Already enriched on an earlier run: leave it exactly as it is.
    const alreadyDemo = await prisma.rentPayment.count({
      where: { tenantLeaseId: lease.id, reference: DEMO_REF },
    });
    if (alreadyDemo > 0) continue;

    // Assigned by position, not by id: lease ids are regenerated on every
    // reseed, so hashing them would make the portfolio mix different each
    // time. Round-robin gives the designed spread on every run.
    const profile = PROFILES[index % PROFILES.length];
    profileCounts[profile]++;

    const schedule = await prisma.rentInstallment.findMany({
      where: { tenantLeaseId: lease.id },
      orderBy: { dueDate: 'asc' },
    });
    const pastDue = schedule.filter(
      (i) => i.dueDate < now && i.amountDue - i.amountPaid > PAID_EPSILON,
    );
    if (pastDue.length === 0) continue;

    // How much of the outstanding history this tenant has actually settled.
    let payable = pastDue;
    let partialLast = false;

    if (profile === 'current') {
      payable = pastDue;
    } else if (profile === 'partial') {
      payable = pastDue;
      partialLast = true;
    } else if (profile === 'overdue') {
      // Leave the two most recent collections outstanding.
      payable = pastDue.slice(0, Math.max(0, pastDue.length - 2));
    } else {
      // sporadic: pays roughly two thirds of what was owed, with gaps.
      payable = pastDue.filter((i, idx) => hashPick(i.id, 3, idx) !== 0);
    }

    for (const inst of payable) {
      const balance = round2(inst.amountDue - inst.amountPaid);
      if (balance <= PAID_EPSILON) continue;

      const isLast = partialLast && inst.id === payable[payable.length - 1].id;
      const amount = isLast
        ? round2(balance * (0.3 + hashPick(inst.id, 4) * 0.1))
        : balance;
      if (amount <= PAID_EPSILON) continue;

      // Tenants pay a few days either side of the due date.
      const drift = hashPick(inst.id, 9) - 3;
      const paidDate = new Date(inst.dueDate.getTime() + drift * 864e5);

      await collectInstallment(
        prisma,
        inst,
        {
          amount,
          paidDate: paidDate > now ? inst.dueDate : paidDate,
          recordedById: admin?.id,
          reference: DEMO_REF,
          note: isLast ? 'Part payment — balance agreed for next month' : undefined,
        },
      );
      collected++;
      collectedAed += amount;
    }

    await recomputeLease(prisma, lease.id);
  }

  console.log(`  🔁 renewed ${renewed} expired lease(s), appended ${appended} installments`);
  console.log(
    `  💰 recorded ${collected} payment(s) totalling AED ${Math.round(collectedAed).toLocaleString()}`,
  );
  console.log(
    `  🎚️  profiles: ` +
      Object.entries(profileCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(' '),
  );
  console.log('\n✅ Demo data ready.');
}

// CLI entry point. Importing this module runs nothing.
if (require.main === module) {
  if (process.env.NODE_ENV === 'production' && !FORCE) {
    console.error('❌ Refusing to run: NODE_ENV=production.');
    console.error('   This script invents payments. Use prisma/backfill-schedules.ts instead.');
    process.exitCode = 1;
  } else {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    enrichDemoData(prisma)
      .catch((e) => {
        console.error('❌ Demo pass failed:', e);
        process.exitCode = 1;
      })
      .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
      });
  }
}
