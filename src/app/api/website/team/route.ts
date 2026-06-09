import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List team members (public vs admin list)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId) {
      // Admin list: all members for this tenant
      const members = await tenantDb.websiteTeamMember.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(members);
    } else {
      // Public list: only visible members for first tenant
      const companyId = await getWebsiteCompanyId();
      const members = await db.websiteTeamMember.findMany({
        where: { companyId, visible: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(members);
    }
  } catch (error) {
    console.error("GET /api/website/team error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

// POST - Create team member (Admin only)
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, role, bio, focus, imageUrl, videoUrl, sortOrder, visible } = body;

    if (!name || !role || !bio || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const member = await tenantDb.websiteTeamMember.create({
      data: {
        name,
        role,
        bio,
        focus: focus || [],
        imageUrl,
        videoUrl: videoUrl || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        visible: typeof visible === "boolean" ? visible : true,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/team error:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
