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

        for (const row of results) {
            try {
                // Clean keys of row to handle BOM and casing
                const cleanedRow: any = {};
                for (const key of Object.keys(row)) {
                    const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
                    cleanedRow[cleanKey] = row[key];
                }

                const name = cleanedRow['name']?.trim();
                if (!name) continue;

                const code = cleanedRow['code']?.trim() || null;
                const contactPerson = cleanedRow['contactperson']?.trim() || cleanedRow['contact_person']?.trim() || null;
                const email = cleanedRow['email']?.trim() || null;
                const phone = cleanedRow['phone']?.trim() || cleanedRow['phoe']?.trim() || null;
                const address = cleanedRow['address']?.trim() || null;
                const city = cleanedRow['city']?.trim() || null;
                const vatCode = cleanedRow['vatcode']?.trim() || cleanedRow['vat_code']?.trim() || null;
                const country = cleanedRow['country']?.trim() || null;

                // Check for existing agent in company by code or name
                let existingAgent = null;
                if (code) {
                    existingAgent = await prisma.agent.findFirst({
                        where: { companyId, code }
                    });
                }
                if (!existingAgent) {
                    existingAgent = await prisma.agent.findFirst({
                        where: { companyId, name }
                    });
                }

                if (existingAgent) {
                    // Update
                    await prisma.agent.update({
                        where: { id: existingAgent.id },
                        data: {
                            name,
                            code,
                            contactPerson,
                            email,
                            phone,
                            address,
                            city,
                            vatCode,
                            country
                        }
                    });
                } else {
                    // Create
                    await prisma.agent.create({
                        data: {
                            name,
                            code,
                            contactPerson,
                            email,
                            phone,
                            address,
                            city,
                            vatCode,
                            country,
                            companyId
                        }
                    });
                }
                successCount++;
            } catch (error) {
                console.error("Agent import row error:", error);
                errorCount++;
            }
        }

        return NextResponse.json({ success: true, count: successCount, errors: errorCount });

    } catch (error: any) {
        console.error("Agent import failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to import agents" },
            { status: 500 }
        );
    }
}
