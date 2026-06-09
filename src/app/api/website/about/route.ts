import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// PUBLIC - Get About Section Content
export async function GET() {
  try {
    const companyId = await getWebsiteCompanyId();
    const about = await db.websiteAbout.findFirst({ where: { companyId } });
    return NextResponse.json(about);
  } catch (error) {
    console.error("GET /api/website/about error:", error);
    return NextResponse.json({ error: "Failed to fetch about section" }, { status: 500 });
  }
}

// ADMIN ONLY - Update About Section Content
export async function PUT(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tagline, title, description1, description2 } = body;

    if (!tagline || !title || !description1 || !description2) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await tenantDb.websiteAbout.findFirst();

    let about;
    if (existing) {
      about = await tenantDb.websiteAbout.update({
        where: { id: existing.id },
        data: { tagline, title, description1, description2 },
      });
    } else {
      about = await tenantDb.websiteAbout.create({
        data: {
          tagline,
          title,
          description1,
          description2,
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(about);
  } catch (error) {
    console.error("PUT /api/website/about error:", error);
    return NextResponse.json({ error: "Failed to update about section" }, { status: 500 });
  }
}
