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
