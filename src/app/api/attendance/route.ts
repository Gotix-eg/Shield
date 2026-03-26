import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

function isHR(role: string | undefined) {
  return role === 'ADMIN' || role === 'HR_MANAGER' || role === 'OWNER';
}

// GET /api/attendance?from=&to=&employeeId=
export const GET = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const empIdStr = searchParams.get('employeeId');
  
  const filters: any = { AND: [] as any[] };
  if (from) filters.AND.push({ clockIn: { gte: new Date(from) } });
  if (to) filters.AND.push({ clockIn: { lte: new Date(to) } });
  if (empIdStr) filters.AND.push({ employeeId: Number(empIdStr) });
  
  // scope by company
  filters.AND.push({ employee: { user: { companyId } } });
  
  // employees can only see their own unless HR
  if (!isHR(role)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
    filters.AND.push({ employeeId: user?.employee?.id ?? 0 });
  }

  const records = await prisma.attendance.findMany({
    where: filters,
    include: { employee: { select: { name: true } } },
    orderBy: { clockIn: 'desc' },
  });
  return NextResponse.json(records);
});

// POST /api/attendance (clock-in)
export const POST = withCompany(async (req: NextRequest, { companyId, userId }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
  const body = await req.json();
  const { employeeId, clockIn, clockOut } = body;
  const targetEmpId = employeeId ? Number(employeeId) : user?.employee?.id;
  
  if (!targetEmpId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

  // Verify employee belongs to company
  const employee = await prisma.employee.findFirst({
    where: { id: targetEmpId, user: { companyId } }
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  // manual add if clockIn provided
  if (clockIn) {
    const rec = await prisma.attendance.create({ data: { employeeId: targetEmpId, clockIn: new Date(clockIn), ...(clockOut?{clockOut:new Date(clockOut)}:{}) } });
    return NextResponse.json(rec, { status: 201 });
  }

  // normal clock-in flow
  const open = await prisma.attendance.findFirst({ where: { employeeId: targetEmpId, clockOut: null } });
  if (open) return NextResponse.json({ error: 'Already clocked in' }, { status: 400 });
  const rec = await prisma.attendance.create({ data: { employeeId: targetEmpId } });
  
  return NextResponse.json(rec, { status: 201 });
});

// PUT /api/attendance (clock-out latest open)
export const PUT = withCompany(async (req: NextRequest, { companyId, userId }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
  const { employeeId } = await req.json();
  const targetEmpId = employeeId ? Number(employeeId) : user?.employee?.id;
  
  if (!targetEmpId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });

  // Verify employee belongs to company
  const employee = await prisma.employee.findFirst({
    where: { id: targetEmpId, user: { companyId } }
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const rec = await prisma.attendance.findFirst({ where: { employeeId: targetEmpId, clockOut: null }, orderBy: { clockIn: 'desc' } });
  if (!rec) return NextResponse.json({ error: 'No open attendance' }, { status: 400 });
  
  const updated = await prisma.attendance.update({ where: { id: rec.id }, data: { clockOut: new Date() } });
  return NextResponse.json(updated);
});
