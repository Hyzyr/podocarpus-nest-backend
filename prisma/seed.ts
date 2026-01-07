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

/**
 * Seed superadmin user
 */
async function seedSuperAdmin() {
  console.log('🔐 Seeding superadmin user...');

  try {
    const existingSuperadmin = await prisma.appUser.findFirst({
      where: { role: UserRole.superadmin },
    });

    if (existingSuperadmin) {
      console.log('ℹ️  Superadmin already exists:', existingSuperadmin.email);
      return existingSuperadmin;
    }

    const passwordHash = await bcrypt.hash(superAdminConfig.password, 10);
    const superadmin = await prisma.appUser.create({
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
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    throw error;
  }
}

/**
 * Seed properties
 */
async function seedProperties() {
  console.log('🏢 Seeding properties...');

  try {
    // Check if properties already exist
    const existingCount = await prisma.property.count();

    if (existingCount > 0) {
      console.log(
        `ℹ️  ${existingCount} properties already exist, skipping seed`,
      );
      return;
    }

    // Create properties using createMany
    const result = await prisma.property.createMany({
      data: properties,
      skipDuplicates: true,
    });

    console.log(`✅ Created ${result.count} properties`);
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    throw error;
  }
}

/**
 * Seed events
 */
async function seedEvents() {
  console.log('🎉 Seeding events...');

  try {
    const existingCount = await prisma.event.count();

    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} events already exist, skipping seed`);
      return;
    }

    // Create events using createMany
    const result = await prisma.event.createMany({
      data: events,
      skipDuplicates: true,
    });

    console.log(`✅ Created ${result.count} events`);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  const startTime = Date.now();

  try {
    // Run all seed functions in a transaction for data integrity
    await prisma.$transaction(async (tx) => {
      // Temporarily replace global prisma with transaction client
      const originalPrisma = global.prisma;
      (global as any).prisma = tx;

      await seedSuperAdmin();
      await seedProperties();
      await seedEvents();

      // Restore global prisma
      (global as any).prisma = originalPrisma;
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
