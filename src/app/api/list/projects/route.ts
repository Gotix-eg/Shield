import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

export const GET = withCompany(async (req: NextRequest, { companyId }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get('clientId');
  const where: any = { companyId };
  if (clientId) where.clientId = parseInt(clientId);

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, name: true, clientId: true },
    orderBy: { name: 'asc' },
  });
  
  return NextResponse.json(projects);
});
