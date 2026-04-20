import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthServer } from '@/lib/auth';
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

// GET /api/agents/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const agent = await prisma.agent.findUnique({
    where: { id },
  });

  if (!agent || agent.companyId !== user.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(agent);
}

// PUT /api/agents/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, country, city, address, phone, email, taxNumber } = body;

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      country: country ?? existing.country,
      city: city ?? existing.city,
      address: address ?? existing.address,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      taxNumber: taxNumber ?? existing.taxNumber,
    },
  });

  return NextResponse.json(agent);
}

// DELETE /api/agents/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = isAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const existing = await prisma.agent.findUnique({ where: { id } });
  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.agent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}