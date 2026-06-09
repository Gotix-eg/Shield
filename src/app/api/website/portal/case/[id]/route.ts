import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const projectId = parseInt(rawId);
  if (isNaN(projectId)) {
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
    if (decoded.role !== "CLIENT_PORTAL" || decoded.projectId !== projectId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
  }

  try {
    // Fetch project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        assignments: {
          include: {
            user: {
              select: { name: true, role: true }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            label: true,
            url: true,
            createdAt: true,
            type: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,
            createdAt: true
          },
          orderBy: {
            dueDate: "asc"
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Map tasks to milestones
    const milestones = project.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status, // e.g. PENDING, IN_PROGRESS, DONE
      date: t.dueDate.toISOString().split("T")[0]
    }));

    // Map attorneys
    const attorneys = project.assignments.map(a => a.user.name);

    return NextResponse.json({
      clientName: project.client.name,
      matterName: project.name,
      caseNumber: project.code,
      status: project.status, // OPEN or CLOSED
      attorneys,
      milestones,
      documents: project.attachments.map(doc => ({
        id: doc.id,
        name: doc.label || "Document",
        url: doc.url,
        date: doc.createdAt.toISOString().split("T")[0]
      }))
    });
  } catch (error) {
    console.error("GET /api/website/portal/case/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
