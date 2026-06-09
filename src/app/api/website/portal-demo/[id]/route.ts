import { NextRequest, NextResponse } from "next/server";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const caseId = parseInt(id);
  if (isNaN(caseId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, subtitle, clientName, matterName, caseNumber, clientEmail, courtName, currentStatus, assignedAttorneys, milestones, documents } = body;

    // Verify case ownership
    const existing = await tenantDb.websitePortalDemo.findFirst({
      where: { id: caseId, companyId: user.companyId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const updated = await tenantDb.websitePortalDemo.update({
      where: { id: caseId },
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
        milestones: milestones !== undefined ? milestones : undefined,
        documents: documents !== undefined ? documents : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PUT /api/website/portal-demo/${id} error:`, error);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const caseId = parseInt(id);
  if (isNaN(caseId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Verify case ownership
    const existing = await tenantDb.websitePortalDemo.findFirst({
      where: { id: caseId, companyId: user.companyId }
    });
    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await tenantDb.websitePortalDemo.delete({
      where: { id: caseId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/website/portal-demo/${id} error:`, error);
    return NextResponse.json({ error: "Failed to delete case" }, { status: 500 });
  }
}
