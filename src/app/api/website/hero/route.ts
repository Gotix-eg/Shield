import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// PUBLIC - Get Hero Section Content
export async function GET() {
  try {
    const companyId = await getWebsiteCompanyId();
    const hero = await db.websiteHero.findFirst({ where: { companyId } });
    return NextResponse.json(hero);
  } catch (error) {
    console.error("GET /api/website/hero error:", error);
    return NextResponse.json({ error: "Failed to fetch hero section" }, { status: 500 });
  }
}

// ADMIN ONLY - Update Hero Section Content
export async function PUT(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tagline, titleFirst, titleSecond, subtitle, ctaBook, ctaPortal } = body;

    if (!tagline || !titleFirst || !titleSecond || !subtitle || !ctaBook || !ctaPortal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Since upsert might not be fully intercepted, we do a findFirst + update or create
    const existing = await tenantDb.websiteHero.findFirst();

    let hero;
    if (existing) {
      hero = await tenantDb.websiteHero.update({
        where: { id: existing.id },
        data: { tagline, titleFirst, titleSecond, subtitle, ctaBook, ctaPortal },
      });
    } else {
      hero = await tenantDb.websiteHero.create({
        data: {
          tagline,
          titleFirst,
          titleSecond,
          subtitle,
          ctaBook,
          ctaPortal,
          companyId: user.companyId,
        },
      });
    }

    return NextResponse.json(hero);
  } catch (error) {
    console.error("PUT /api/website/hero error:", error);
    return NextResponse.json({ error: "Failed to update hero section" }, { status: 500 });
  }
}
