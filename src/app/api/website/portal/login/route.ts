import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseNumber, email } = body;

    if (!caseNumber || !email) {
      return NextResponse.json({ error: "Missing case number or email" }, { status: 400 });
    }

    // Find matching case tracker demo
    const portalDemo = await prisma.websitePortalDemo.findFirst({
      where: {
        caseNumber: caseNumber,
        clientEmail: {
          equals: email,
          mode: "insensitive"
        }
      }
    });

    if (!portalDemo) {
      return NextResponse.json({ error: "Invalid case number or email address" }, { status: 401 });
    }

    // Sign a short-lived token for this case
    const token = jwt.sign(
      {
        portalDemoId: portalDemo.id,
        email: email,
        role: "CLIENT_PORTAL"
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return NextResponse.json({ token, projectId: portalDemo.id });
  } catch (error) {
    console.error("POST /api/website/portal/login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
