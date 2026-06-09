import { NextRequest, NextResponse } from "next/server";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { label, sortOrder, active } = body;

    const existing = await tenantDb.websiteScheduleSlot.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
    }

    const updated = await tenantDb.websiteScheduleSlot.update({
      where: { id },
      data: {
        label: label !== undefined ? label : existing.label,
        sortOrder: typeof sortOrder === "number" ? sortOrder : existing.sortOrder,
        active: typeof active === "boolean" ? active : existing.active,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/website/schedule-slots/[id] error:", error);
    return NextResponse.json({ error: "Failed to update schedule slot" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const existing = await tenantDb.websiteScheduleSlot.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
    }

    await tenantDb.websiteScheduleSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/website/schedule-slots/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete schedule slot" }, { status: 500 });
  }
}
