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

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const projectId = searchParams.get('projectId');

  const where: any = { companyId: user.companyId };
  if (clientId) where.clientId = Number(clientId);
  if (projectId) where.projectId = Number(projectId);

  const agents = await prisma.agent.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(agents);
}

// POST /api/agents - create agent
export async function POST(req: NextRequest) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, country, city, address, phone, email, taxNumber, clientId, projectId } = body;

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
      clientId: clientId ? Number(clientId) : null,
      projectId: projectId ? Number(projectId) : null,
      companyId: user.companyId,
    },
  });

  return NextResponse.json(agent, { status: 201 });
}