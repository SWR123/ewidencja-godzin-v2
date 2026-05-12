import { prisma } from '../lib/db';

async function main() {
  const result = await prisma.user.updateMany({
    where: { isActive: false },
    data: { isActive: true }
  });
  console.log(`Activated ${result.count} users`);
}

main().then(() => prisma.$disconnect());
