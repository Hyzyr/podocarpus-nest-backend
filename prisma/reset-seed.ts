/**
 * Prisma 7 Reset Seed Script
 *
 * Drops and re-creates properties, events, tenant leases, and payments.
 * Superadmin is upserted (created if missing, kept if exists).
 *
 * Run with: npx prisma db seed
 * Or:       npm run prisma:reset-seed
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import {
  superAdminConfig,
  properties,
  events,
  tenantLeases,
} from './seed-data.js';

// 1. Setup the connection pool and adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Pass the adapter to PrismaClient
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Type alias for the transaction client
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Upsert superadmin user (never deleted)
 */
async function seedSuperAdmin(tx: TxClient) {
  console.log('🔐 Upserting superadmin user...');

  const existingSuperadmin = await tx.appUser.findFirst({
    where: { role: UserRole.superadmin },
  });

  if (existingSuperadmin) {
    console.log('ℹ️  Superadmin already exists:', existingSuperadmin.email);
    return existingSuperadmin;
  }

  const passwordHash = await bcrypt.hash(superAdminConfig.password, 10);
  const superadmin = await tx.appUser.create({
    data: {
      email: superAdminConfig.email,
      passwordHash,
      role: UserRole.superadmin,
      isEnabled: true,
      firstName: superAdminConfig.firstName,
      lastName: superAdminConfig.lastName,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  console.log('✅ Superadmin created:', superadmin.email);
  return superadmin;
}

/**
 * Delete then re-create properties
 */
async function resetProperties(tx: TxClient) {
  console.log('🏢 Resetting properties...');

  // Delete all existing (cascades to tenant leases → payments)
  const deleted = await tx.property.deleteMany({});
  console.log(`  🗑️  Deleted ${deleted.count} existing properties`);

  const result = await tx.property.createMany({
    data: properties,
  });

  console.log(`  ✅ Created ${result.count} properties`);
}

/**
 * Delete then re-create events
 */
async function resetEvents(tx: TxClient) {
  console.log('🎉 Resetting events...');

  const deleted = await tx.event.deleteMany({});
  console.log(`  🗑️  Deleted ${deleted.count} existing events`);

  const result = await tx.event.createMany({
    data: events,
  });

  console.log(`  ✅ Created ${result.count} events`);
}

/**
 * Create tenant leases and their payments.
 * Looks up each property by unitNo, creates the lease,
 * then bulk-creates the nested payment rows.
 */
async function seedTenantLeasesAndPayments(
  tx: TxClient,
  adminId: string,
) {
  console.log('📋 Seeding tenant leases and payments...');

  // Fetch all properties to map unitNo → id
  const allProperties = await tx.property.findMany({
    select: { id: true, unitNo: true },
  });
  const unitMap = new Map(allProperties.map((p) => [p.unitNo, p.id]));

  let leaseCount = 0;
  let paymentCount = 0;

  for (const lease of tenantLeases) {
    const propertyId = unitMap.get(lease.unitNo);
    if (!propertyId) {
      console.warn(`  ⚠️  No property found for unitNo "${lease.unitNo}", skipping`);
      continue;
    }

    const isActive = (lease as any).isActive !== undefined
      ? (lease as any).isActive
      : true;

    const created = await tx.tenantLease.create({
      data: {
        propertyId,
        tenantName: lease.tenantName,
        tenantEmail: lease.tenantEmail ?? null,
        tenantPhone: lease.tenantPhone ?? null,
        leaseStart: new Date(lease.leaseStart),
        leaseEnd: lease.leaseEnd ? new Date(lease.leaseEnd) : null,
        monthlyRent: lease.monthlyRent,
        annualRent: lease.annualRent,
        paymentMethod: lease.paymentMethod ?? null,
        depositAmount: lease.depositAmount ?? null,
        isActive,
      },
    });

    leaseCount++;

    if (lease.payments.length > 0) {
      const result = await tx.rentPayment.createMany({
        data: lease.payments.map((p) => ({
          tenantLeaseId: created.id,
          amount: p.amount,
          paidDate: new Date(p.paidDate),
          type: p.type,
          note: p.note ?? null,
          recordedById: adminId,
        })),
      });
      paymentCount += result.count;
    }
  }

  console.log(`  ✅ Created ${leaseCount} tenant leases`);
  console.log(`  ✅ Created ${paymentCount} rent payments`);
}

/**
 * Main reset seed function
 */
async function main() {
  console.log('🌱 Starting database reset seed...\n');

  const startTime = Date.now();

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1. Ensure superadmin exists (returns the user)
        const admin = await seedSuperAdmin(tx);

        // 2. Drop and re-create properties (cascades leases + payments)
        await resetProperties(tx);

        // 3. Drop and re-create events
        await resetEvents(tx);

        // 4. Create tenant leases and payments
        await seedTenantLeasesAndPayments(tx, admin.id);
      },
      { timeout: 60_000 },
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Database reset seed completed in ${duration}s`);
  } catch (error) {
    console.error('\n❌ Reset seed failed:', error);
    throw error;
  }
}

// Execute main function
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
