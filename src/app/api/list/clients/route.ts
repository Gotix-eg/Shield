import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

export const GET = withCompany(async (req: NextRequest, { companyId }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  
  return NextResponse.json(clients);
});
