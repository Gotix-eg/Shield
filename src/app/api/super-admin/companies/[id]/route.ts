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

// PATCH /api/super-admin/companies/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSuperAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const { status, maxSeats, subscriptionEnds, subscriptionPlan } = body;

  const data: any = {};
  if (status !== undefined) data.status = status;
  if (maxSeats !== undefined) data.maxSeats = Number(maxSeats);
  if (subscriptionEnds !== undefined) data.subscriptionEnds = subscriptionEnds ? new Date(subscriptionEnds) : null;

  const updated = await prisma.company.update({ where: { id }, data });
  return NextResponse.json(updated);
}
