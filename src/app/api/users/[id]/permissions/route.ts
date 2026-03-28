import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

// GET /api/users/[id]/permissions -> list explicit permissions for user
export async function GET(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await (ctx.params as any);
  const targetUserId = Number(id);

  return withCompany(async (_req: NextRequest, { companyId, userId: requesterId, role }) => {
    if (!companyId || !requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const target = await prisma.user.findFirst({ where: { id: targetUserId, companyId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isSelf = targetUserId === requesterId;
    const isSuper = role === 'OWNER' || role === 'ADMIN';
    if (!isSelf && !isSuper) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const records = await prisma.userPermission.findMany({
      where: { userId: targetUserId },
      include: { permission: true },
    });
    return NextResponse.json(records.map(r => ({ code: r.permission.code, allowed: r.allowed })));
  })(req);
}

// PUT body: { permissions: { [code:string]: boolean } }
export async function PUT(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await (ctx.params as any);
  const targetUserId = Number(id);

  return withCompany(async (_req: NextRequest, { companyId, userId: requesterId, role }) => {
    if (!companyId || !requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const target = await prisma.user.findFirst({ where: { id: targetUserId, companyId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isSuper = role === 'OWNER' || role === 'ADMIN';
    let hasManage = false;
    if (!isSuper) {
      const perm = await prisma.userPermission.findFirst({
        where: {
          userId: requesterId,
          allowed: true,
          permission: { code: 'manage_lawyers' },
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

    await prisma.userPermission.deleteMany({ where: { userId: targetUserId } });

    for (const [code, allowed] of Object.entries(permissions)) {
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code.replace(/_/g, ' ') },
      });
      await prisma.userPermission.create({
        data: {
          allowed: Boolean(allowed),
          user: { connect: { id: targetUserId } },
          permission: { connect: { code } },
        },
      });
    }
    return NextResponse.json({ ok: true });
  })(req);
}
