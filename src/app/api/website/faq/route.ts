import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";
import { getWebsiteCompanyId } from "@/lib/getWebsiteCompanyId";

// GET - List FAQs
export async function GET(req: NextRequest) {
  try {
    const user = await verifyWebsiteAuth(req);

    if (user && user.companyId) {
      const faqs = await tenantDb.websiteFaq.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(faqs);
    } else {
      const companyId = await getWebsiteCompanyId();
      const faqs = await db.websiteFaq.findMany({
        where: { companyId, visible: true },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json(faqs);
    }
  } catch (error) {
    console.error("GET /api/website/faq error:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

// POST - Create FAQ (Admin only)
export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer, sortOrder, visible } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const faq = await tenantDb.websiteFaq.create({
      data: {
        question,
        answer,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        visible: typeof visible === "boolean" ? visible : true,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("POST /api/website/faq error:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
