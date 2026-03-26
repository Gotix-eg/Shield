import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

function isHR(role: string | undefined) {
  if(!role) return false;
  const r = role.toUpperCase();
  if (r === 'ADMIN' || r === 'OWNER' || r === 'HR_MANAGER') return true;
  if (r === 'ADMIN_REPORTS' || r === 'ACCOUNTANT_MASTER') return true;
  return r === 'HR' || r.startsWith('HR_') || r === 'HRMANAGER' || r.startsWith('HR');
}

// ---------------------------------------------------------------------------
// GET /api/penalties?employeeId=
// HR: sees all / filter by employee
// Employee: sees own only
// ---------------------------------------------------------------------------
export const GET = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const empIdParam = req.nextUrl.searchParams.get('employeeId');
  const where: any = {};
  if (empIdParam) where.employeeId = Number(empIdParam);

  if (!isHR(role)) {
    // not HR: limit to their own employee record
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { employee: true } });
    if (!user?.employee?.id) return NextResponse.json([], { status: 200 });
    where.employeeId = user.employee.id;
  } else {
    // HR / admin – scope by companyId
    where.employee = { user: { companyId } };
  }
  
  const penalties = await prisma.penalty.findMany({
    where,
    include: { employee: { select: { name: true } }, createdBy: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(penalties);
});

// ---------------------------------------------------------------------------
// POST /api/penalties  (HR only)
// body: { employeeId, amount, currency, reason, date? }
// ---------------------------------------------------------------------------
export const POST = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isHR(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const { employeeId, amount, days, currency: curInput='USD', reason, date } = await req.json();
  if (!employeeId) return NextResponse.json({ error:'employeeId required'},{status:400});

  // Verify employee belongs to company
  const employee = await prisma.employee.findFirst({
    where: { id: Number(employeeId), user: { companyId } }
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  let amt:number|undefined = amount;
  let curr = curInput;
  if(amt===undefined && days!==undefined){
    const latest = await prisma.salary.findFirst({ where:{ employeeId:Number(employeeId) }, orderBy:{ effectiveFrom:'desc' } });
    if(!latest) return NextResponse.json({ error:'No salary found to derive amount'},{status:400});
    curr = latest.currency;
    amt = (Number(latest.amount)/30*Number(days));
  }
  if(amt===undefined) return NextResponse.json({ error:'amount or days required'},{status:400});
  
  const penalty = await prisma.penalty.create({
    data:{
      employeeId:Number(employeeId),
      amount: Number(amt.toFixed(2)),
      currency: curr,
      reason: reason ?? (days?`UNPAID_LEAVE ${days} days`:null),
      date: date? new Date(date): new Date(),
      createdById: userId,
    }
  });
  return NextResponse.json(penalty, { status: 201 });
});
