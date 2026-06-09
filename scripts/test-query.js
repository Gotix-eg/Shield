const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const companies = await prisma.company.findMany();
    console.log("Companies:", companies);
    
    const users = await prisma.user.findMany({ 
      select: { id: true, email: true, role: true, companyId: true },
      take: 10
    });
    console.log("Users:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
