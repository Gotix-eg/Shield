import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List contact inquiries (Admin only)
export async function GET(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inquiries = await tenantDb.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("GET /api/website/inquiries error:", error);
    return NextResponse.json({ error: "Failed to fetch contact inquiries" }, { status: 500 });
  }
}

// POST - Submit contact inquiry (Public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const companyId = await getWebsiteCompanyId();

    const inquiry = await db.contactInquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        companyId,
      },
    });

    // Generate notifications for admins of the company
    const admins = await db.user.findMany({
      where: {
        companyId,
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map(u => ({
          userId: u.id,
          type: 'CONTACT_INQUIRY',
          message: `New contact inquiry from ${name}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
          read: false
        }))
      });
    }

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/inquiries error:", error);
    return NextResponse.json({ error: "Failed to submit contact inquiry" }, { status: 500 });
  }
}
