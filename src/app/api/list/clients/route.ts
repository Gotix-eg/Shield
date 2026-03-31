import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const ADMIN_ROLES = ['OWNER', 'ADMIN', 'MANAGING_PARTNER', 'ACCOUNTANT_MASTER', 'ACCOUNTANT_ASSISTANT', 'LAWYER_PARTNER', 'HR_MANAGER', 'HR', 'ADMIN_REPORTS'];

function decodeToken(req: NextRequest): { userId: number; role: string; companyId?: number } | null {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const dec: any = jwt.verify(token, JWT_SECRET);
    const userId = Number(dec.sub ?? dec.id);
    const role = dec.role ?? 'LAWYER';
    const companyId = dec.companyId ? Number(dec.companyId) : undefined;
    return { userId, role, companyId };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = decodeToken(req);
  if (!user) return NextResponse.json([], { status: 200 });

  const { userId, role, companyId } = user;

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
