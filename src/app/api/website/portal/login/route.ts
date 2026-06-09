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

    // Find a project with matching project code (caseNumber)
    const project = await prisma.project.findFirst({
      where: {
        code: caseNumber,
        client: {
          contactEmail: {
            equals: email,
            mode: "insensitive"
          }
        }
      },
      include: {
        client: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Invalid case number or email address" }, { status: 401 });
    }

    // Sign a short-lived token for this case
    const token = jwt.sign(
      {
        projectId: project.id,
        clientId: project.clientId,
        email: email,
        role: "CLIENT_PORTAL"
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return NextResponse.json({ token, projectId: project.id });
  } catch (error) {
    console.error("POST /api/website/portal/login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
