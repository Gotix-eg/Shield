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
    const { title, institution, description, sortOrder, visible } = body;

    const existing = await tenantDb.websiteAward.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    const updated = await tenantDb.websiteAward.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        institution: institution !== undefined ? institution : existing.institution,
        description: description !== undefined ? description : existing.description,
        sortOrder: typeof sortOrder === "number" ? sortOrder : existing.sortOrder,
        visible: typeof visible === "boolean" ? visible : existing.visible,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/website/awards/[id] error:", error);
    return NextResponse.json({ error: "Failed to update award" }, { status: 500 });
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
    const existing = await tenantDb.websiteAward.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    await tenantDb.websiteAward.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/website/awards/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete award" }, { status: 500 });
  }
}
