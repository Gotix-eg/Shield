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
        const lastClient = await prisma.client.findFirst({ orderBy: { id: 'desc' }, select: { code: true } });
        const lastAccount = await prisma.account.findFirst({
            where: { code: { startsWith: 'AR-C' } },
            orderBy: { id: 'desc' },
            select: { code: true },
        });
        const seqFromClient = lastClient?.code ? parseInt(lastClient.code.replace(/^C/, '')) : 0;
        const seqFromAccount = lastAccount?.code ? parseInt(lastAccount.code.replace(/^AR-C/, '')) : 0;
        let nextSeq = Math.max(isNaN(seqFromClient) ? 0 : seqFromClient, isNaN(seqFromAccount) ? 0 : seqFromAccount) + 1;

        for (const row of results) {
            try {
                if (!row.name) continue;

                // Generate a sequential code if missing
                let code = row.code;
                if (!code) {
                    code = `C${nextSeq.toString().padStart(4, '0')}`;
                    nextSeq++;
                }

                // Find or create AR account (similar to creating new client logic)
                let arAccount = await prisma.account.findFirst({ where: { code: `AR-${code}`, companyId } });
                if (!arAccount) {
                    arAccount = await prisma.account.create({
                        data: {
                            code: `AR-${code}`,
                            name: `${code} Receivable`,
                            type: 'ASSET',
                            companyId,
                        },
                    });
                }

                await prisma.client.upsert({
                    where: { code }, // Assumes code is unique across system or handling collision
                    update: {
                        name: row.name,
                        contactPerson: row.contactPerson || row['Contact Person'],
                        contactEmail: row.email,
                        phone: row.phone,
                        address: row.address,
                        city: row.city,
                        vatCode: row.vatCode,
                        country: row.country,
                    },
                    create: {
                        name: row.name,
                        code,
                        contactPerson: row.contactPerson || row['Contact Person'],
                        contactEmail: row.email,
                        phone: row.phone,
                        address: row.address,
                        city: row.city,
                        vatCode: row.vatCode,
                        country: row.country,
                        companyId,
                        ownerId: userId,
                        accountId: arAccount.id
                    },
                });
                successCount++;
            } catch (error) {
                console.error(`Import error for row ${row.name}:`, error);
                errorCount++;
            }
        }

        return NextResponse.json({ success: true, count: successCount, errors: errorCount });

    } catch (error: any) {
        console.error("Import failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to import clients" },
            { status: 500 }
        );
    }
}
