const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@shieldadvocates.com';
  const password = 'Letmein@NZ';
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN', passwordHash: hash },
    });
    console.log('Super Admin updated:', email);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        companyId: null, // super admin doesn't belong to a specific firm
      },
    });
    console.log('Super Admin created:', email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
