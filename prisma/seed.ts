/**
 * Prisma 7 Seed Script
 *
 * This script seeds the database with initial data.
 * Run with: npx prisma db seed
 *
 * Features:
 * - Idempotent operations (safe to run multiple times)
 * - Transaction support for data integrity
 * - Environment-based configuration
 * - Detailed logging
 * - PostgreSQL adapter for improved performance
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { superAdminConfig, properties, events } from './seed-data.js';

// 1. Setup the connection pool and adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Pass the adapter to PrismaClient
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Enable query logging in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
  });
}

// Type alias for the transaction client
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Seed superadmin user
 */
async function seedSuperAdmin(tx: TxClient) {
  console.log('🔐 Seeding superadmin user...');

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
  console.log('⚠️  Default credentials - CHANGE PASSWORD after first login!');
  return superadmin;
}

/**
 * Seed properties
 */
async function seedProperties(tx: TxClient) {
  console.log('🏢 Seeding properties...');

  const existingCount = await tx.property.count();

  if (existingCount > 0) {
    console.log(
      `ℹ️  ${existingCount} properties already exist, skipping seed`,
    );
    return;
  }

  const result = await tx.property.createMany({
    data: properties,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} properties`);
}

/**
 * Seed events
 */
async function seedEvents(tx: TxClient) {
  console.log('🎉 Seeding events...');

  const existingCount = await tx.event.count();

  if (existingCount > 0) {
    console.log(`ℹ️  ${existingCount} events already exist, skipping seed`);
    return;
  }

  const result = await tx.event.createMany({
    data: events,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} events`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  const startTime = Date.now();

  try {
    await prisma.$transaction(async (tx) => {
      await seedSuperAdmin(tx);
      await seedProperties(tx);
      await seedEvents(tx);
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Database seeded successfully in ${duration}s`);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// Execute main function
main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
