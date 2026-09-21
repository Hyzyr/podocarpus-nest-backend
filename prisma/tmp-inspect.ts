import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const props = await prisma.property.count();
  const vacant = await prisma.property.count({ where: { isVacant: true } });
  const leases = await prisma.tenantLease.findMany({
    include: { payments: { orderBy: { paidDate: 'asc' } }, _count: { select: { installments: true } } },
    orderBy: { leaseStart: 'asc' },
  });
  const inst = await prisma.rentInstallment.count();
  console.log(`properties=${props} (vacant ${vacant}) leases=${leases.length} installments=${inst}`);
  console.log(`payments total=${leases.reduce((s, l) => s + l.payments.length, 0)}`);
  console.log('\nlease | active | start → end | annualRent | pmts | paidRange | sched');
  for (const l of leases) {
    const first = l.payments[0]?.paidDate.toISOString().slice(0, 10) ?? '-';
    const last = l.payments.at(-1)?.paidDate.toISOString().slice(0, 10) ?? '-';
    const sum = l.payments.reduce((s, p) => s + p.amount, 0);
    console.log(
      `${(l.tenantName ?? '?').slice(0, 22).padEnd(22)} | ${l.isActive ? 'Y' : 'n'} | ` +
      `${l.leaseStart.toISOString().slice(0, 10)} → ${l.leaseEnd?.toISOString().slice(0, 10) ?? 'open'} | ` +
      `${String(l.annualRent).padStart(7)} | ${String(l.payments.length).padStart(2)} | ${first}..${last} | ` +
      `paid=${sum} | inst=${l._count.installments}`,
    );
  }
  const types = await prisma.rentPayment.groupBy({ by: ['type'], _count: true });
  console.log('\npayment types:', types.map((t) => `${t.type}=${t._count}`).join(' '));
}
main().finally(() => prisma.$disconnect());
