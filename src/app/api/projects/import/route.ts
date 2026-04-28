import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Readable } from 'stream';
import csv from 'csv-parser';

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
        if (typeof decoded === 'string') return undefined;
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

        // Get the current max sequence to generate sequential codes
        const lastProject = await prisma.project.findFirst({
            where: { companyId },
            orderBy: { id: 'desc' },
            select: { code: true }
        });
        let nextSeq = 1;
        if (lastProject?.code && lastProject.code.startsWith('P')) {
            const lastSeq = parseInt(lastProject.code.replace(/^P/, ''));
            if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }

        for (const row of results) {
            try {
                // Normalize keys to handle spaces and casing
                const normalizedRow: any = {};
                for (const key of Object.keys(row)) {
                    normalizedRow[key.toLowerCase().replace(/\s/g, "")] = row[key];
                }

                const projectName = normalizedRow.name || normalizedRow.projectname || row["Project Name"] || row["projectName"];
                const clientIdentifier = normalizedRow.clientcode || normalizedRow.clientname || normalizedRow.client || row["Client"];
                
                if (!projectName || !clientIdentifier) {
                    console.warn("Skipping row due to missing required fields:", { projectName, clientIdentifier, row });
                    continue;
                }

                // Find client
                const client = await prisma.client.findFirst({
                    where: {
                        companyId,
                        OR: [
                            { code: String(clientIdentifier) },
                            { name: { contains: String(clientIdentifier), mode: 'insensitive' } }
                        ]
                    }
                });

                if (!client) {
                    console.error(`Client not found for identifier: ${clientIdentifier}`);
                    errorCount++;
                    continue;
                }

                // Generate code if missing
                let code = normalizedRow.code || normalizedRow.projectcode || row.code;
                if (!code) {
                    code = `P${nextSeq.toString().padStart(4, '0')}`;
                    nextSeq++;
                }

                const status = (normalizedRow.status || row.status || 'OPEN').toUpperCase();

                await prisma.project.upsert({
                    where: { code_companyId: { code, companyId } },
                    update: {
                        name: projectName,
                        status: status,
                        clientId: client.id,
                    },
                    create: {
                        name: projectName,
                        code,
                        status: status,
                        clientId: client.id,
                        companyId,
                    },
                });
                successCount++;
            } catch (error) {
                console.error(`Import error for row:`, row, error);
                errorCount++;
            }
        }

        return NextResponse.json({ success: true, count: successCount, errors: errorCount });

    } catch (error: any) {
        console.error("Import failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to import projects" },
            { status: 500 }
        );
    }
}
