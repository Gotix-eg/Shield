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

  let where: any = {};
  if (companyId) where.companyId = companyId;

  const clientParam = req.nextUrl.searchParams.get('clientId');
  if (clientParam) where.clientId = parseInt(clientParam);

  // Non-admin roles: only show projects the user is assigned to
  if (!ADMIN_ROLES.includes(role)) {
    where.assignments = { some: { userId } };
  }

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, name: true, clientId: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(projects);
}
