import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

export const GET = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Staff shouldn't be able to list all users generally
  if (role === 'STAFF') {
    return NextResponse.json([]);
  }

  const projectIdParam = req.nextUrl.searchParams.get('projectId');
  const projectId = projectIdParam ? Number(projectIdParam) : undefined;

  const whereClause: any = { companyId };
  if (projectId) {
    whereClause.assignments = { some: { projectId } };
  }

  const list = await prisma.user.findMany({
    where: whereClause,
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(list);
});
