/**
 * Script to create the Super Admin account
 * Run: npx ts-node scripts/seed-superadmin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@shieldadvocates.com';
  const password = 'Letmein@NZ';
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Update role to SUPER_ADMIN if already exists
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' as any, passwordHash: hash },
    });
    console.log('Super Admin updated:', email);
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        passwordHash: hash,
        role: 'SUPER_ADMIN' as any,
        companyId: null,
      },
    });
    console.log('Super Admin created:', email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
