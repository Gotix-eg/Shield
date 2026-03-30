import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(req: NextRequest): { id: number; role: string } | null {
  const hdr = req.headers.get('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, JWT_SECRET) as any;
    return { id: Number(p.sub ?? p.id), role: p.role ?? 'STAFF' };
  } catch {
    return null;
  }
}

// POST /api/init-accountant-permissions
export async function POST(req: NextRequest) {
  const user = auth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Only OWNER or ADMIN can initialize permissions
  const allowedRoles = ['OWNER', 'ADMIN'];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get all ACCOUNTANT_MASTER users
    const accountantMasters = await prisma.user.findMany({
      where: { role: 'ACCOUNTANT_MASTER' },
      select: { id: true }
    });

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    // Give ACCOUNTANT_MASTER all permissions
    for (const accountant of accountantMasters) {
      // Clear existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId: accountant.id }
      });

      // Add all permissions
      for (const permission of allPermissions) {
        await prisma.userPermission.create({
          data: {
            userId: accountant.id,
            permissionId: permission.id,
            allowed: true
          }
        });
      }
    }

    return NextResponse.json({ 
      message: `Initialized permissions for ${accountantMasters.length} ACCOUNTANT_MASTER users`,
      users: accountantMasters.length
    });
  } catch (error) {
    console.error('Error initializing accountant permissions:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
