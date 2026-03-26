import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withCompany } from '@/lib/with-company';

function isAccountant(role: string | undefined): boolean {
  return role && ['ADMIN','ACCOUNTANT_MASTER','ACCOUNTANT_ASSISTANT','OWNER'].includes(role);
}

export const GET = withCompany(async (_req: NextRequest, { companyId }) => {
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tx = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    take: 100,
    include: {
      lines: true,
      creator: { select: { id: true, name: true } },
    },
    where: {
      // at least one line belongs to an account under this company
      lines: {
        some: {
          account: {
            companyId: companyId,
          },
        },
      },
    },
  });
  return NextResponse.json(tx);
});

export const POST = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAccountant(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { date, memo, lines } = await req.json() as { date?: string; memo?: string; lines: { accountId: number; debit?: number; credit?: number; currency?: string }[] };
  if (!lines || !Array.isArray(lines) || lines.length < 2) {
    return NextResponse.json({ error: 'At least 2 lines required' }, { status: 400 });
  }

  // ensure all accounts belong to the same company
  const accountIds = lines.map((l) => l.accountId);
  const accounts = await prisma.account.findMany({ where: { id: { in: accountIds }, companyId } });
  if (accounts.length !== accountIds.length) {
    const validSet = new Set(accounts.map(a => a.id));
    const invalidIds = accountIds.filter(id => !validSet.has(id));
    return NextResponse.json({ error: 'Invalid accountId for company', invalid: invalidIds }, { status: 400 });
  }

  // balance check
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (totalDebit !== totalCredit) {
    return NextResponse.json({ error: 'Debits and credits not equal' }, { status: 400 });
  }

  try {
    const tx = await prisma.transaction.create({
      data: {
        date: date ? new Date(date) : new Date(),
        memo,
        createdBy: userId,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            currency: l.currency || 'USD',
          })),
        },
      },
      include: { lines: true },
    });
    return NextResponse.json(tx, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/transactions', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
