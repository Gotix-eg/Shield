import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const LAWYER_ROLES = [
  'LAWYER', 'LAWYER_MANAGER', 'LAWYER_PARTNER', 'MANAGING_PARTNER', 'ADMIN',
];

export async function GET(req: NextRequest) {
  // Read companyId from JWT bearer token
  let companyId: number | undefined;
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      const dec: any = jwt.verify(token, JWT_SECRET);
      if (dec.companyId) companyId = Number(dec.companyId);
    }
  } catch {
    companyId = undefined;
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
