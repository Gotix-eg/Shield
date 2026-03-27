import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

const LAWYER_ROLES = [
  'LAWYER', 'LAWYER_MANAGER', 'LAWYER_PARTNER', 'MANAGING_PARTNER'
];

export const GET = withCompany(async (req: NextRequest, { companyId }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseWhere: any = { 
    role: { in: LAWYER_ROLES },
    companyId: companyId
  };

  let lawyers = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  
  return NextResponse.json(lawyers);
});
