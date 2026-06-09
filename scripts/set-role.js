const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'info@shieldadvocates.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { role: 'OWNER', companyId: 1 },
    });
    console.log('✅ Updated info@shieldadvocates.com to OWNER with companyId: 1');
  } else {
    console.log('❌ User not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
