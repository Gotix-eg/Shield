import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// PUBLIC - Get Case Tracker Portal Demo Section Content
export async function GET() {
  try {
    const companyId = await getWebsiteCompanyId();
    const portalDemo = await db.websitePortalDemo.findFirst({ where: { companyId } });
    return NextResponse.json(portalDemo);
  } catch (error) {
    console.error("GET /api/website/portal-demo error:", error);
    return NextResponse.json({ error: "Failed to fetch portal demo" }, { status: 500 });
  }
}

// ADMIN ONLY - Update Case Tracker Portal Demo Content
export async function PUT(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, subtitle, clientName, matterName, caseNumber, clientEmail, courtName, currentStatus, assignedAttorneys, milestones, documents } = body;

    if (!title || !subtitle || !clientName || !matterName || !caseNumber || !clientEmail || !courtName || !currentStatus || !assignedAttorneys || !milestones || !documents) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await tenantDb.websitePortalDemo.findFirst();

    let portalDemo;
    if (existing) {
      portalDemo = await tenantDb.websitePortalDemo.update({
        where: { id: existing.id },
        data: { title, subtitle, clientName, matterName, caseNumber, clientEmail, courtName, currentStatus, assignedAttorneys, milestones, documents },
      });
    } else {
      portalDemo = await tenantDb.websitePortalDemo.create({
        data: {
          title,
          subtitle,
          clientName,
          matterName,
          caseNumber,
          clientEmail,
          courtName,
          currentStatus,
          assignedAttorneys,
          milestones,
          documents,
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(portalDemo);
  } catch (error) {
    console.error("PUT /api/website/portal-demo error:", error);
    return NextResponse.json({ error: "Failed to update portal demo" }, { status: 500 });
  }
}
