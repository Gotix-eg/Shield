import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const portalDemoId = parseInt(rawId);
  if (isNaN(portalDemoId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Get token from headers
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== "CLIENT_PORTAL" || decoded.portalDemoId !== portalDemoId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
  }

  try {
    // Fetch portal demo details
    const portalDemo = await prisma.websitePortalDemo.findUnique({
      where: { id: portalDemoId }
    });

    if (!portalDemo) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Parse attorneys (comma-separated to array)
    const attorneys = portalDemo.assignedAttorneys
      ? portalDemo.assignedAttorneys.split(",").map(a => a.trim())
      : [];

    // Parse milestones
    const milestones = Array.isArray(portalDemo.milestones)
      ? portalDemo.milestones
      : JSON.parse(portalDemo.milestones as string || "[]");

    // Parse documents
    const documents = Array.isArray(portalDemo.documents)
      ? portalDemo.documents
      : JSON.parse(portalDemo.documents as string || "[]");

    return NextResponse.json({
      clientName: portalDemo.clientName,
      matterName: portalDemo.matterName,
      caseNumber: portalDemo.caseNumber,
      status: portalDemo.currentStatus.toUpperCase().includes("CLOSED") ? "CLOSED" : "OPEN",
      courtName: portalDemo.courtName,
      attorneys,
      milestones,
      documents
    });
  } catch (error) {
    console.error("GET /api/website/portal/case/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
