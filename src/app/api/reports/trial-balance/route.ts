import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

// GET /api/reports/trial-balance?start=YYYY-MM-DD&end=YYYY-MM-DD
export const GET = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowed = role === 'OWNER' || role === 'MANAGING_PARTNER' || role === 'ACCOUNTANT_MASTER' || role === 'LAWYER_PARTNER' || role === 'LAWYER_MANAGER';
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined;
  const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : undefined;

  // fetch all accounts with aggregates
  const accounts = await prisma.account.findMany({ where: { companyId }, orderBy: { code: 'asc' } });

  const rows = [] as Array<{ code: string; name: string; debit: number; credit: number; balance: number }>;
  let totalDebit = 0;
  let totalCredit = 0;

  for (const acct of accounts) {
    const agg = await prisma.transactionLine.aggregate({
      where: {
        accountId: acct.id,
        transaction: { date: { gte: start, lte: end } },
      },
      _sum: { debit: true, credit: true },
    });
    const debit = Number(agg._sum.debit) || 0;
    const credit = Number(agg._sum.credit) || 0;
    const balance = debit - credit;
    if (debit !== 0 || credit !== 0) {
      rows.push({ code: acct.code, name: acct.name, debit, credit, balance });
    }
    totalDebit += debit;
    totalCredit += credit;
  }

  return NextResponse.json({ rows, totalDebit, totalCredit });
});
