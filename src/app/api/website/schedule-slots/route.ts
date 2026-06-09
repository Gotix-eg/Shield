import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List schedule slots
export async function GET(req: NextRequest) {
  try {
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId) {
      const slots = await tenantDb.websiteScheduleSlot.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(slots);
    } else {
      const companyId = await getWebsiteCompanyId();
      const slots = await db.websiteScheduleSlot.findMany({
        where: { companyId, active: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(slots);
    }
  } catch (error) {
    console.error("GET /api/website/schedule-slots error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule slots" }, { status: 500 });
  }
}

// POST - Create schedule slot (Admin only)
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, sortOrder, active } = body;

    if (!label) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slot = await tenantDb.websiteScheduleSlot.create({
      data: {
        label,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        active: typeof active === "boolean" ? active : true,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/schedule-slots error:", error);
    return NextResponse.json({ error: "Failed to create schedule slot" }, { status: 500 });
  }
}
