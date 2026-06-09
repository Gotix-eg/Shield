import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - Get cases: list of all cases for admin, or first case for public preview
export async function GET(req: NextRequest) {
  try {
    const companyId = await getWebsiteCompanyId();
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId === companyId) {
      // Authenticated admin - return all cases for the firm
      const list = await db.websitePortalDemo.findMany({
        where: { companyId },
        orderBy: { updatedAt: "desc" }
      });
      return NextResponse.json(list);
    } else {
      // Public - return first case (default preview mockup)
      const portalDemo = await db.websitePortalDemo.findFirst({ where: { companyId } });
      return NextResponse.json(portalDemo);
    }
  } catch (error) {
    console.error("GET /api/website/portal-demo error:", error);
    return NextResponse.json({ error: "Failed to fetch portal demo content" }, { status: 500 });
  }
}

// POST - Create a new Case Portal for a client
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, subtitle, clientName, matterName, caseNumber, clientEmail, courtName, currentStatus, assignedAttorneys } = body;

    if (!clientName || !clientEmail) {
      return NextResponse.json({ error: "Client Name and Email are required" }, { status: 400 });
    }

    // Auto-generate Case Number if not provided
    let caseNum = caseNumber;
    if (!caseNum) {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      caseNum = `SA-CASE-${year}-${randNum}`;
    }

    // Check if caseNumber already exists
    const existing = await tenantDb.websitePortalDemo.findFirst({
      where: { caseNumber: caseNum }
    });
    if (existing) {
      return NextResponse.json({ error: `Case number "${caseNum}" already exists. Please use a unique one.` }, { status: 400 });
    }

    const newCase = await tenantDb.websitePortalDemo.create({
      data: {
        title: title || "Shield Advocates Client Portal Preview",
        subtitle: subtitle || "Track active milestones, review pleadings, and view court schedules. This live interactive workspace demonstrates how Shield Advocates utilizes state-of-the-art legal tech to deliver transparency to our corporate partners.",
        clientName,
        matterName: matterName || "Intellectual Property Opposition & Trademark Litigation",
        caseNumber: caseNum,
        clientEmail,
        courtName: courtName || "Cairo Economic Court",
        currentStatus: currentStatus || "Pleadings Submitted - Awaiting Court Verdict",
        assignedAttorneys: assignedAttorneys || "Hassane El Sheref",
        milestones: [
          {
            title: "Case Registered",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: "COMPLETED",
            description: "Case setup complete and initial records established on the system portal."
          }
        ],
        documents: [],
        companyId: user.companyId,
      },
    });

    return NextResponse.json(newCase);
  } catch (error) {
    console.error("POST /api/website/portal-demo error:", error);
    return NextResponse.json({ error: "Failed to create portal demo case" }, { status: 500 });
  }
}
