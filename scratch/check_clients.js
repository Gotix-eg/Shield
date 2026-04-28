const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: {
      name: { contains: 'AURIUM', mode: 'insensitive' }
    },
    select: { id: true, name: true, code: true, companyId: true }
  });
  console.log(JSON.stringify(clients, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
