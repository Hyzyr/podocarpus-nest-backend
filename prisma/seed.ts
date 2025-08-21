import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.appUser.create({
    data: {
      email: 'alice@example.com',
      passwordHash: 'supersecret',
      role: 'investor',
    },
  });
}

main()
  .then(() => console.log('Seeded ✅'))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
