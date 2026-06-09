import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List practice areas
export async function GET(req: NextRequest) {
  try {
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId) {
      const practices = await tenantDb.websitePractice.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(practices);
    } else {
      const companyId = await getWebsiteCompanyId();
      const practices = await db.websitePractice.findMany({
        where: { companyId, visible: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(practices);
    }
  } catch (error) {
    console.error("GET /api/website/practices error:", error);
    return NextResponse.json({ error: "Failed to fetch practice areas" }, { status: 500 });
  }
}

// POST - Create practice area (Admin only)
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, title, shortDesc, longDesc, icon, sortOrder, visible } = body;

    if (!slug || !title || !shortDesc || !longDesc || !icon) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const practice = await tenantDb.websitePractice.create({
      data: {
        slug,
        title,
        shortDesc,
        longDesc,
        icon,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        visible: typeof visible === "boolean" ? visible : true,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(practice, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/practices error:", error);
    return NextResponse.json({ error: "Failed to create practice area" }, { status: 500 });
  }
}
