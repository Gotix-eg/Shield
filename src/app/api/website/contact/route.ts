import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// PUBLIC - Get Contact Info
export async function GET() {
  try {
    const companyId = await getWebsiteCompanyId();
    const contact = await db.websiteContact.findFirst({ where: { companyId } });
    return NextResponse.json(contact);
  } catch (error) {
    console.error("GET /api/website/contact error:", error);
    return NextResponse.json({ error: "Failed to fetch contact info" }, { status: 500 });
  }
}

// ADMIN ONLY - Update Contact Info
export async function PUT(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { officeTitle, address, phone, email, workingHours } = body;

    if (!officeTitle || !address || !phone || !email || !workingHours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await tenantDb.websiteContact.findFirst();

    let contact;
    if (existing) {
      contact = await tenantDb.websiteContact.update({
        where: { id: existing.id },
        data: { officeTitle, address, phone, email, workingHours },
      });
    } else {
      contact = await tenantDb.websiteContact.create({
        data: {
          officeTitle,
          address,
          phone,
          email,
          workingHours,
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("PUT /api/website/contact error:", error);
    return NextResponse.json({ error: "Failed to update contact info" }, { status: 500 });
  }
}
