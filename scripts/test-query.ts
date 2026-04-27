import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        contactPerson: true,
      },
      take: 2
    });
    console.log("Success:", clients);
  } catch (error) {
    console.error("Error querying clients:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
