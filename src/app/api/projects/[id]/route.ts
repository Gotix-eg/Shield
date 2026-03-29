import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function getUserId(request: NextRequest): number | null {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: number };
    return Number(decoded.sub);
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const data = await request.json();
  
  // Get user role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const userRole = user?.role;
  
  // Ensure project belongs to user
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Check permissions:
  // - Owner can edit any project
  // - Lawyer can only edit projects they are assigned to
  if (userRole === 'OWNER') {
    // Owner can edit any project
  } else if (userRole === 'LAWYER') {
    // Lawyer can only edit projects they are assigned to
    const assignment = await prisma.projectAssignment.findFirst({
      where: { projectId: id, userId, canLogTime: true }
    });
    if (!assignment) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    // Other roles cannot edit
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.project.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(params.id);
    
    // Get user role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userRole = user?.role;
    
    // Ensure project belongs to user
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Check permissions:
    // - Owner can delete any project
    // - Lawyer can only delete projects they are assigned to
    if (userRole === 'OWNER') {
      // Owner can delete any project
    } else if (userRole === 'LAWYER') {
      // Lawyer can only delete projects they are assigned to
      const assignment = await prisma.projectAssignment.findFirst({
        where: { projectId: id, userId, canLogTime: true }
      });
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Other roles cannot delete
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await prisma.$transaction([
      prisma.timeEntry.deleteMany({ where: { projectId: id } }),
      prisma.expense.deleteMany({ where: { projectId: id } }),
      prisma.projectAssignment.deleteMany({ where: { projectId: id } }),
      prisma.document.deleteMany({ where: { projectId: id } }),
      // first delete invoice items & payments linked to project invoices
      prisma.invoiceItem.deleteMany({ where: { invoice: { projectId: id } } }),
      prisma.payment.deleteMany({ where: { invoice: { projectId: id } } }),
      prisma.trustTransaction.deleteMany({ where: { invoice: { projectId: id } } }),
      prisma.invoice.deleteMany({ where: { projectId: id } }),
      prisma.advancePayment.deleteMany({ where: { projectId: id } }),
      prisma.trustTransaction.deleteMany({ where: { projectId: id } }),
      prisma.trustAccount.deleteMany({ where: { projectId: id } }),
      prisma.project.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (err:any) {
    console.error('Project delete error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
