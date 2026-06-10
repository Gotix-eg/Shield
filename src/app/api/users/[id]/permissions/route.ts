import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, JWT_SECRET) as any;
    return { id: Number(p.sub ?? p.id), role: p.role ?? 'STAFF' };
  } catch {
    return null;
  }
}

// GET /api/users/[id]/permissions -> list explicit permissions for user
export async function GET(_: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await ctx.params as { id: string };
  const userId = Number(id);
  const records = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  return NextResponse.json(records.map(r => ({ code: r.permission.code, allowed: r.allowed })));
}

// PUT body: { permissions: { [code:string]: boolean } }
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const userId = Number(id);
    const currentUser = auth(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isSuper = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'OWNER';
    let hasManage = false;
    if (!isSuper) {
      const perm = await prisma.userPermission.findFirst({
        where: {
          userId: currentUser.id,
          allowed: true,
          permission: { code: 'manage_users' },
        },
        include: { permission: true },
      });
      hasManage = !!perm;
    }
    if (!isSuper && !hasManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { permissions } = await req.json();
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'permissions object required' }, { status: 400 });
    }

    // Reset explicit permissions for this user then recreate from payload
    await prisma.userPermission.deleteMany({ where: { userId } });

    for (const [code, allowed] of Object.entries(permissions)) {
      // ensure permission record exists
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code.replace(/_/g, ' ') },
      });
      await prisma.userPermission.create({
        data: {
          allowed: Boolean(allowed),
          user: { connect: { id: userId } },
          permission: { connect: { code } },
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PUT /api/users/[id]/permissions error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

