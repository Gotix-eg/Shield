import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function isSuperAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  try {
    const dec: any = jwt.verify(token, JWT_SECRET);
    return dec.role === 'SUPER_ADMIN';
  } catch { return false; }
}

// GET /api/super-admin/companies
export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const companies = await prisma.company.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { id: 'desc' },
  });

  return NextResponse.json(companies);
}

// PATCH /api/super-admin/companies - update company details
export async function PATCH(req: NextRequest) {
  if (!isSuperAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, name, status, subscriptionEnds, maxSeats } = body;

  if (!id) return NextResponse.json({ error: 'Missing company id' }, { status: 400 });

  try {
    const updated = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(subscriptionEnds && { subscriptionEnds: new Date(subscriptionEnds) }),
        ...(maxSeats !== undefined && { maxSeats }),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Failed to update company', details: error.message }, { status: 500 });
  }
}
