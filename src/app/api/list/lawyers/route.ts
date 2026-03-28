import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

const LAWYER_ROLES = [
  'LAWYER', 'LAWYER_MANAGER', 'LAWYER_PARTNER', 'MANAGING_PARTNER'
];

export const GET = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseWhere: any = { 
    role: { in: LAWYER_ROLES },
    companyId: companyId
  };

  if (role === 'LAWYER_MANAGER' || role === 'LAWYER_PARTNER') {
    const managed = await prisma.managerLawyer.findMany({ where: { managerId: Number(userId) }, select: { lawyerId: true } });
    const ids = managed.map(m => m.lawyerId);
    baseWhere.id = { in: ids.length ? ids : [-1] };
  } else if (role === 'LAWYER') {
    baseWhere.id = Number(userId);
  }

  let lawyers = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  
  return NextResponse.json(lawyers);
});
