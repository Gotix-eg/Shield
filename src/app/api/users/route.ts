import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

export const GET = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Staff shouldn't be able to list all users generally
  // But OWNER, ADMIN, and ACCOUNTANT_MASTER can
  const restrictedRoles = ['STAFF', 'LAWYER', 'LAWYER_MANAGER', 'LAWYER_PARTNER', 'HR_MANAGER'];
  if (restrictedRoles.includes(role as string)) {
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
