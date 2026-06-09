import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List awards
export async function GET(req: NextRequest) {
  try {
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId) {
      const awards = await tenantDb.websiteAward.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(awards);
    } else {
      const companyId = await getWebsiteCompanyId();
      const awards = await db.websiteAward.findMany({
        where: { companyId, visible: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(awards);
    }
  } catch (error) {
    console.error("GET /api/website/awards error:", error);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}

// POST - Create award (Admin only)
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, institution, description, sortOrder, visible } = body;

    if (!title || !institution || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const award = await tenantDb.websiteAward.create({
      data: {
        title,
        institution,
        description,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        visible: typeof visible === "boolean" ? visible : true,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(award, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/awards error:", error);
    return NextResponse.json({ error: "Failed to create award" }, { status: 500 });
  }
}
