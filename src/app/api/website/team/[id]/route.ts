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
    const { name, role, bio, focus, imageUrl, videoUrl, sortOrder, visible } = body;

    // First check if the member exists and belongs to the company
    const existing = await tenantDb.websiteTeamMember.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updated = await tenantDb.websiteTeamMember.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        role: role !== undefined ? role : existing.role,
        bio: bio !== undefined ? bio : existing.bio,
        focus: focus !== undefined ? focus : existing.focus,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        videoUrl: videoUrl !== undefined ? (videoUrl === "" ? null : videoUrl) : existing.videoUrl,
        sortOrder: typeof sortOrder === "number" ? sortOrder : existing.sortOrder,
        visible: typeof visible === "boolean" ? visible : existing.visible,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/website/team/[id] error:", error);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
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
    const existing = await tenantDb.websiteTeamMember.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await tenantDb.websiteTeamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/website/team/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
