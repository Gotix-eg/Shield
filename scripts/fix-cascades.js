const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCascade() {
  console.log("Adding ON DELETE CASCADE manually to companyId constraints...");
  
  // Get all foreign keys that point to Company(id)
  const q = `
    SELECT tc.table_name, kcu.column_name, tc.constraint_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu 
      ON tc.constraint_name = kcu.constraint_name 
    WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'companyId';
  `;
  
  const constraints = await prisma.$queryRawUnsafe(q);
  console.log(`Found ${constraints.length} constraints for companyId.`);
  
  for (const c of constraints) {
    console.log(`Updating ${c.table_name}.${c.constraint_name}...`);
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "${c.table_name}" DROP CONSTRAINT "${c.constraint_name}"`);
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log(`✔ Updated ${c.table_name}`);
  }

  // Also need to cascade for users since users have nested relations 
  // Wait, if a User is deleted via Company CASCADE, User's related tasks will fail if they aren't ON DELETE CASCADE to User!
  
  console.log("Done");
}

addCascade().catch(console.error).finally(() => prisma.$disconnect());
