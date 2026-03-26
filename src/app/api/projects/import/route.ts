
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Readable } from 'stream';
import csv from 'csv-parser';
import { ProjectStatus } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function getUserId(req: NextRequest): number | undefined {
    let token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
    if (!token) {
        const cookie = req.cookies.get("token");
        token = cookie?.value || "";
    }
    if (!token) return undefined;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (typeof decoded === 'string') return undefined; // Should be object
        const claim = decoded.sub ?? decoded.id ?? decoded.userId;
        const userId = parseInt(String(claim), 10);
        return Number.isNaN(userId) ? undefined : userId;
    } catch {
        return undefined;
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
        if (!user?.companyId) {
            return NextResponse.json({ error: "User company not found" }, { status: 400 });
        }
        const companyId = user.companyId;

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        const results: any[] = [];

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of results) {
            try {
                if (!row.name || !row.clientCode) {
                    errorCount++;
                    errors.push(`Row missing name or clientCode: ${JSON.stringify(row)}`);
                    continue;
                }

                // Find client by code
                const client = await prisma.client.findFirst({
                    where: { code: row.clientCode, companyId }
                });

                if (!client) {
                    errorCount++;
                    errors.push(`Client not found for code: ${row.clientCode}`);
                    continue;
                }

                const code = row.code || `P${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

                let status: ProjectStatus = 'OPEN';
                if (row.status) {
                    const normalized = row.status.toUpperCase();
                    if (Object.values(ProjectStatus).includes(normalized as ProjectStatus)) {
                        status = normalized as ProjectStatus;
                    }
                }

                const budget = row.budget ? parseFloat(row.budget) : 0;

                // Parse dates if present, otherwise null
                const startDate = row.startDate ? new Date(row.startDate) : undefined;
                const endDate = row.endDate ? new Date(row.endDate) : undefined;

                await prisma.project.upsert({
                    where: {
                        companyId_code: {
                            companyId,
                            code
                        }
                    },
                    update: {
                        name: row.name,
                        status,
                        budget,
                        startDate,
                        endDate,
                        description: row.description,
                        clientId: client.id, // Update relation if needed
                    },
                    create: {
                        name: row.name,
                        code,
                        status,
                        budget,
                        startDate,
                        endDate,
                        description: row.description,
                        clientId: client.id,
                        companyId,
                        ownerId: userId, // Default owner to importer
                    },
                });
                successCount++;
            } catch (error: any) {
                console.error(`Import error for row ${row.name}:`, error);
                errorCount++;
                errors.push(`Error importing ${row.name}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            errorCount,
            errors
        });

    } catch (error: any) {
        console.error("Import failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to import projects" },
            { status: 500 }
        );
    }
}
