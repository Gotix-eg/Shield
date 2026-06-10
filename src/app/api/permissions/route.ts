import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ensure core permission exists
  await prisma.permission.upsert({
    where: { code: "admin_all" },
    update: {},
    create: { code: "admin_all", name: "Full Admin Access" }
  });

  // List all possible permissions
  const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json(permissions);
}
