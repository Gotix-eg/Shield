const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userId = 3;
  const permissions = {
    edit_hero: false,
    edit_portal_cases: false,
    edit_practices: false,
    edit_slots: false,
    edit_team: false,
    view_consultations: true,
    view_inquiries: true
  };

  try {
    // Reset explicit permissions for this user then recreate from payload
    await prisma.userPermission.deleteMany({ where: { userId } });

    for (const [code, allowed] of Object.entries(permissions)) {
      // ensure permission record exists
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code.replace(/_/g, ' ') },
      });
      await prisma.userPermission.create({
        data: {
          allowed: Boolean(allowed),
          user: { connect: { id: userId } },
          permission: { connect: { code } },
        },
      });
    }
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR TYPE:", err.constructor.name);
    console.error("ERROR MESSAGE:", err.message);
    console.error(err);
  }
}

test().finally(() => prisma.$disconnect());
