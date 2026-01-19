require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
console.log('PRISMA_DATABASE_URL (Original):', process.env.PRISMA_DATABASE_URL ? 'Loaded' : 'Not Loaded');
process.env.PRISMA_DATABASE_URL = process.env.DATABASE_URL;
console.log('Switched to DATABASE_URL for local execution');
const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

interface ClientRow {
    name: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
}

async function main() {
    const filePath = process.argv[2] || 'scripts/clients_template.csv';

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const results: ClientRow[] = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
            console.log(`Processing ${results.length} records...`);

            // Defaults
            const companyId = 1;
            const ownerId = 1;

            for (const row of results) {
                try {
                    if (!row.name) {
                        console.warn('Skipping row without name:', row);
                        continue;
                    }

                    // Generate a code if missing, using the first 4 uppercase letters of name + random
                    const code = row.code || (row.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000));

                    await prisma.client.upsert({
                        where: { code },
                        update: {
                            name: row.name,
                            contactEmail: row.email,
                            phone: row.phone,
                            address: row.address,
                        },
                        create: {
                            name: row.name,
                            code,
                            contactEmail: row.email,
                            phone: row.phone,
                            address: row.address,
                            companyId,
                            ownerId,
                        },
                    });
                    console.log(`Imported: ${row.name}`);
                } catch (error) {
                    console.error(`Failed to import ${row.name}:`, error);
                }
            }

            console.log('Done!');
            await prisma.$disconnect();
        });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
