import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

export async function GET() {
  try {
    const companyId = await getWebsiteCompanyId();

    const [hero, about, team, practices, awards, contact, faq, slots, portalDemo] = 
      await Promise.all([
        prisma.websiteHero.findFirst({ where: { companyId } }),
        prisma.websiteAbout.findFirst({ where: { companyId } }),
        prisma.websiteTeamMember.findMany({
          where: { companyId, visible: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.websitePractice.findMany({
          where: { companyId, visible: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.websiteAward.findMany({
          where: { companyId, visible: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.websiteContact.findFirst({ where: { companyId } }),
        prisma.websiteFaq.findMany({
          where: { companyId, visible: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.websiteScheduleSlot.findMany({
          where: { companyId, active: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.websitePortalDemo.findFirst({ where: { companyId } }),
      ]);

    return NextResponse.json({
      hero,
      about,
      team,
      practices,
      awards,
      contact,
      faq,
      scheduleSlots: slots,
      portalDemo,
    });
  } catch (error: any) {
    console.error("GET /api/website/content error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
