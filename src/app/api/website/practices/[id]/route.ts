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
    const { slug, title, shortDesc, longDesc, icon, sortOrder, visible } = body;

    const existing = await tenantDb.websitePractice.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Practice area not found" }, { status: 404 });
    }

    const updated = await tenantDb.websitePractice.update({
      where: { id },
      data: {
        slug: slug !== undefined ? slug : existing.slug,
        title: title !== undefined ? title : existing.title,
        shortDesc: shortDesc !== undefined ? shortDesc : existing.shortDesc,
        longDesc: longDesc !== undefined ? longDesc : existing.longDesc,
        icon: icon !== undefined ? icon : existing.icon,
        sortOrder: typeof sortOrder === "number" ? sortOrder : existing.sortOrder,
        visible: typeof visible === "boolean" ? visible : existing.visible,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/website/practices/[id] error:", error);
    return NextResponse.json({ error: "Failed to update practice area" }, { status: 500 });
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
    const existing = await tenantDb.websitePractice.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Practice area not found" }, { status: 404 });
    }

    await tenantDb.websitePractice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/website/practices/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete practice area" }, { status: 500 });
  }
}
