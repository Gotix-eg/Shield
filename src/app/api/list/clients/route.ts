import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth/next';
import { authOptions, getAuthServer } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MANAGING_PARTNER', 'ACCOUNTANT_MASTER', 'ACCOUNTANT_ASSISTANT', 'LAWYER_PARTNER', 'HR_MANAGER', 'HR', 'ADMIN_REPORTS'];

export async function GET(req: NextRequest) {
  let session = await getServerSession(authOptions);
  if (!session?.user) {
    const raw = getAuthServer(req);
    if (raw) {
      try {
        const decoded = jwt.verify(raw, JWT_SECRET) as any;
        session = { user: decoded } as any;
      } catch {}
    }
  }

  if (!session?.user) return NextResponse.json([], { status: 200 });

  const userId = Number(session.user.id);
  const role = (session.user as any).role as string || 'LAWYER';
  const companyId = (session.user as any).companyId ? Number((session.user as any).companyId) : undefined;

  let clients;

  if (ADMIN_ROLES.includes(role)) {
    // Admins see all clients in company
    const where: any = companyId ? { companyId } : {};
    clients = await prisma.client.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  } else {
    // Non-admin: only clients whose projects the user is assigned to
    const assignedProjects = await prisma.projectAssignment.findMany({
      where: { userId },
      select: { project: { select: { clientId: true } } },
    });
    const clientIds = [...new Set(assignedProjects.map((a: any) => a.project.clientId))];
    if (clientIds.length === 0) return NextResponse.json([]);
    clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  return NextResponse.json(clients);
}
