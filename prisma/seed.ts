import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.property.createMany({
    data: [
      {
        title: 'Silver Tower - Office on 11th Floor',
        description:
          'High-rise commercial building in Cluster I of JLT, completed in 2009. Freehold, DMCC free zone, covered parking, 37 floors, restaurants, and 24-hour security.',
        area: 'Jumeirah Lake Towers (JLT)',
        buildingName: 'Silver Tower',
        contractValue: 5290000,
        developer: 'DMCC',
        unitNo: '1101',
        floor: 11,
        condition: 'Full fitted & renovated',
        unitTotalSize: 1664.0,
        status: 'Rented',
        city: 'Dubai',
        country: 'UAE',
        images: [
          '/uploads/bc-6.jpg',
          '/uploads/8697620160515040128-Large-1024x768-1.jpg',
          '/uploads/Jumeirah_Lake_Tower_Silver_Tower_20201910_1_3fcd020691_b5ef8cc3e3.jpg',
        ],
        netRoiMin: 8,
        netRoiMax: 8,
        isTaxFreeZone: true,
        keyBenefits: [
          '100% Foreign Ownership',
          'Tax-Free Zone',
          'Full Capital Repatriation',
        ],
        freezoneAuthority: 'DMCC Freezone',
        rentValue: 465000,
        rentStart: new Date('2025-05-06'), // adjust if known
        rentExpiry: new Date('2030-05-06'),
        rateYear: 2025,
        vacancyRisk: 'Low',
        serviceChargePerSqft: null,
        serviceChargeTotal: null,
      },
      {
        title: 'Gold Tower - Office on 5th Floor',
        description:
          'High-rise commercial building in Cluster I of JLT, also called AU Tower. Completed in 2009. Freehold, DMCC free zone, covered parking, 37 floors, restaurants, and 24-hour security.',
        area: 'Jumeirah Lake Towers (JLT)',
        buildingName: 'Gold Tower',
        contractValue: 5267616,
        developer: 'DMCC',
        unitNo: '0501',
        floor: 5,
        condition: 'Full fitted & renovated',
        unitTotalSize: 1120.95,
        status: 'Rented',
        city: 'Dubai',
        country: 'UAE',
        images: [
          '/uploads/au-tower-1552_xl.jpg',
          '/uploads/8697620160515040128-Large-1024x768-1.jpg',
        ],
        netRoiMin: 8,
        netRoiMax: 8,
        isTaxFreeZone: true,
        keyBenefits: [
          '100% Foreign Ownership',
          'Tax-Free Zone',
          'Full Capital Repatriation',
        ],
        freezoneAuthority: 'DMCC Freezone',
        rentValue: 395000,
        rentStart: new Date(),
        rentExpiry: null,
        rateYear: 2025,
        vacancyRisk: 'Low',
      },
      {
        title: 'Mazaya AA1 - Office on 29th Floor',
        description:
          'Mazaya Business Avenue AA1, freehold commercial tower with 45 floors. Completed 2012 by Mazaya Holding Co. DMCC free zone with modern amenities.',
        area: 'Jumeirah Lake Towers (JLT)',
        buildingName: 'Mazaya AA1',
        contractValue: 4176216,
        developer: 'Mazaya Holding Co.',
        unitNo: '2901',
        floor: 29,
        condition: 'Full fitted & renovated',
        unitTotalSize: 1689.18,
        status: 'Rented',
        city: 'Dubai',
        country: 'UAE',
        images: [
          '/uploads/AMR_9699 copy.jpg',
          '/uploads/mazaya-business-avenue-8188_xl.jpg',
        ],
        netRoiMin: 8,
        netRoiMax: 8,
        isTaxFreeZone: true,
        keyBenefits: [
          '100% Foreign Ownership',
          'Tax-Free Zone',
          'Full Capital Repatriation',
        ],
        freezoneAuthority: 'DMCC Freezone',
        rentValue: 340000,
        rentStart: new Date(),
        rentExpiry: null,
        rateYear: 2025,
        vacancyRisk: 'Low',
      },
      {
        title: 'Fortune Tower - Office on 20th Floor',
        description:
          '37-storey commercial tower in Cluster C, JLT. Completed in 2008 by Fortune Investments. Features gymnasium, swimming pool, sauna, meeting rooms, restaurants, salons, and pharmacy.',
        area: 'Jumeirah Lake Towers (JLT)',
        buildingName: 'Fortune Tower',
        contractValue: 7590000,
        developer: 'Fortune Investments',
        unitNo: '2001',
        floor: 20,
        condition: 'Full fitted & renovated',
        unitTotalSize: 2620.0,
        status: 'Rented',
        city: 'Dubai',
        country: 'UAE',
        images: [
          '/uploads/fortune-tower.avif',
          '/uploads/fortune-tower-767_xl-28129-resize_gallery.avif',
        ],
        netRoiMin: 8,
        netRoiMax: 8,
        isTaxFreeZone: true,
        keyBenefits: [
          '100% Foreign Ownership',
          'Tax-Free Zone',
          'Full Capital Repatriation',
        ],
        freezoneAuthority: 'DMCC Freezone',
        rentValue: 600000,
        rentStart: new Date(),
        rentExpiry: null,
        rateYear: 2025,
        vacancyRisk: 'Low',
      },
    ],
  });
  await prisma.event.createMany({
    data: [
      {
        title: 'Dubai Beach Picnic Afternoon',
        description:
          'Relaxing afternoon at Jumeirah Beach with food, games, and live acoustic music. Perfect for networking and family fun.',
        startsAt: new Date('2025-10-10T15:00:00Z'),
        endsAt: new Date('2025-10-10T20:00:00Z'),
        location: 'Jumeirah Beach, Dubai',
        totalMembers: 50,
        budget: 2500.0,
        image: '/uploads/4867.jpg',
        status: 'OPEN',
        isActive: true,
      },
      {
        title: 'Private Party at Dubai Marina',
        description:
          'An exclusive private party at a rooftop lounge in Dubai Marina. Invite-only event with premium catering and entertainment.',
        startsAt: new Date('2025-10-18T21:00:00Z'),
        endsAt: new Date('2025-10-19T02:00:00Z'),
        location: 'Dubai Marina, Rooftop Lounge',
        totalMembers: 120,
        budget: 15000.0,
        image: '/uploads/92743.jpg',
        status: 'OPEN',
        isActive: true,
      },
      {
        title: 'DJ Night at Downtown Dubai',
        description:
          'High-energy electronic music night featuring international DJs and stunning views of Burj Khalifa. Open to all music lovers.',
        startsAt: new Date('2025-11-01T22:00:00Z'),
        endsAt: new Date('2025-11-02T03:00:00Z'),
        location: 'Downtown Dubai, Burj Park',
        totalMembers: 300,
        budget: 25000.0,
        image: '/uploads/122068.jpg',
        status: 'OPEN',
        isActive: true,
      },
    ],
  });
}

main()
  .then(() => console.log('Seeded ✅'))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
