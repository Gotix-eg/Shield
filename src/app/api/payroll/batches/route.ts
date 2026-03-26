import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

function canCreateBatch(role: string | undefined) {
  if (!role) return false;
  return role === 'ADMIN' || role === 'OWNER' || role.startsWith('HR');
}

// GET list batches
export const GET = withCompany(async (req: NextRequest, { companyId, userId }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const batches = await prisma.payrollBatch.findMany({
    where: { companyId },
    include: { items: { select: { id: true, netSalary: true, employee: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(batches);
});

// POST create batch body { year, month }
export const POST = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canCreateBatch(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { year, month } = await req.json();
  if (!year || !month) return NextResponse.json({ error: 'year, month required' }, { status: 400 });

  const existing = await prisma.payrollBatch.findFirst({ where: { companyId, year, month } });
  if (existing) return NextResponse.json({ error: 'Batch exists' }, { status: 400 });

  // active employees in company
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE', user: { companyId } },
    include: {
      salaries: {
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      },
      salaryDeductions: {
        where: {
          issuedOn: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        },
      },
    },
  });

  const itemsData = employees.map((emp) => {
    const gross = emp.salaries[0]?.amount || 0;
    const totalDed = emp.salaryDeductions.reduce((acc, d) => acc + Number(d.amount), 0);
    const net = Number(gross) - totalDed;
    return {
      employeeId: emp.id,
      grossSalary: gross,
      totalDeductions: totalDed,
      netSalary: net,
    };
  });

  const batch = await prisma.payrollBatch.create({
    data: {
      companyId,
      month,
      year,
      createdById: userId,
      items: { createMany: { data: itemsData } },
    },
    include: { items: true },
  });

  return NextResponse.json(batch, { status: 201 });
});

// DELETE /api/payroll/batches?id=123
export const DELETE = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canCreateBatch(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const batch = await prisma.payrollBatch.findFirst({ where: { id: Number(id), companyId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  await prisma.payrollBatch.delete({ where: { id: batch.id } });
  return NextResponse.json({ ok: true });
});
