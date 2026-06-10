import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/utils/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const standardPerms = [
    { code: "admin_all", name: "Full Admin Access" },
    { code: "approve_expenses", name: "Approve Expenses" },
    { code: "approve_invoices", name: "Approve Invoices" },
    { code: "view_accounts", name: "View Accounts" },
    { code: "manage_lawyers", name: "Manage Users" },
    { code: "approve_time", name: "Approve Time" },
    { code: "view_reports", name: "View Reports" },
    { code: "manage_groups", name: "Manage Groups" },
    { code: "positions", name: "Positions" },
    { code: "assign_projects", name: "Assign Projects" },
    { code: "employees", name: "Employees" },
    { code: "website", name: "Website" },
  ];

  for (const p of standardPerms) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: { code: p.code, name: p.name }
    });
  }

  // List all possible permissions
  const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json(permissions);
}

export async function POST(req: NextRequest) {
  const user = await getAuth();
  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await req.json();
  const { code, name } = data;
  if (!code || !name) {
    return NextResponse.json({ error: 'code and name required' }, { status: 400 });
  }
  try {
    const perm = await prisma.permission.create({ data: { code, name } });
    return NextResponse.json(perm, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Permission exists?' }, { status: 400 });
  }
}
