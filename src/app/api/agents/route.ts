import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions, getAuthServer } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function isAuth(req: NextRequest): any {
  const token = getAuthServer(req);
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// GET /api/agents - list agents
export async function GET(req: NextRequest) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agents = await prisma.agent.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(agents);
}

// POST /api/agents - create agent
export async function POST(req: NextRequest) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, country, city, address, phone, email, taxNumber, code, contactPerson, vatCode } = body;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const agent = await prisma.agent.create({
    data: {
      name,
      country,
      city,
      address,
      phone,
      email,
      taxNumber,
      code,
      contactPerson,
      vatCode,
      companyId: user.companyId,
    },
  });

  return NextResponse.json(agent, { status: 201 });
}