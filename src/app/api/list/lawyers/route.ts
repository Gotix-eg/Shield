import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth/next';
import { authOptions, getAuthServer } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const LAWYER_ROLES = [
  'LAWYER', 'LAWYER_MANAGER', 'LAWYER_PARTNER', 'MANAGING_PARTNER', 'ADMIN',
];

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

  let companyId: number | undefined;
  if (session?.user) {
    companyId = (session.user as any).companyId ? Number((session.user as any).companyId) : undefined;
  }

  // Also accept companyId as query param (fallback)
  const qCompany = req.nextUrl.searchParams.get('companyId');
  if (!companyId && qCompany) companyId = Number(qCompany);

  const baseWhere: any = { role: { in: LAWYER_ROLES } };
  if (companyId) baseWhere.companyId = companyId;

  const lawyers = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(lawyers);
}
