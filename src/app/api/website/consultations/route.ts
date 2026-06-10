import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List consultation requests (Admin only)
export async function GET(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const consultations = await tenantDb.consultationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(consultations);
  } catch (error) {
    console.error("GET /api/website/consultations error:", error);
    return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 });
  }
}

// POST - Submit consultation request (Public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, phone, summary, practiceId, date, timeSlot } = body;

    if (!name || !email || !date || !timeSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const companyId = await getWebsiteCompanyId();

    const consultation = await db.consultationRequest.create({
      data: {
        name,
        email,
        company: company || null,
        phone: phone || null,
        summary: summary || null,
        practiceId: practiceId || null,
        date,
        timeSlot,
        companyId,
      },
    });

    // Generate notifications for admins of the company
    const admins = await db.user.findMany({
      where: {
        companyId,
        role: { in: ['ADMIN', 'MANAGING_PARTNER', 'OWNER'] }
      }
    });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map(u => ({
          userId: u.id,
          type: 'CONSULTATION_REQUEST',
          message: `New consultation request from ${name} on ${date} at ${timeSlot}`,
          read: false
        }))
      });
    }

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/consultations error:", error);
    return NextResponse.json({ error: "Failed to submit consultation request" }, { status: 500 });
  }
}
