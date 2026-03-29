import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

// GET /api/reports/ledger?accountId=1&start=2025-01-01&end=2025-12-31
export const GET = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowed = role === 'OWNER' || role === 'MANAGING_PARTNER' || role === 'ACCOUNTANT_MASTER' || role === 'LAWYER_PARTNER' || role === 'LAWYER_MANAGER';
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const accountId = Number(searchParams.get('accountId'));
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 });
  const start = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined;
  const end = searchParams.get('end') ? new Date(searchParams.get('end')!) : undefined;

  const acct = await prisma.account.findFirst({ where: { id: accountId, companyId }, select: { id: true } });
  if (!acct) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Opening balance = sum of lines before start (debit - credit)
  const openingAgg = await prisma.transactionLine.aggregate({
    where: {
      accountId,
      transaction: { date: { lt: start } },
    },
    _sum: { debit: true, credit: true },
  });
  const opening = (Number(openingAgg._sum.debit) || 0) - (Number(openingAgg._sum.credit) || 0);

  // fetch lines within range
  const lines = await prisma.transactionLine.findMany({
    where: {
      accountId,
      transaction: {
        date: {
          gte: start,
          lte: end,
        },
      },
    },
    include: { transaction: { select: { id: true, date: true, memo: true } } },
    orderBy: { transaction: { date: 'asc' } },
  });

  // compute running balance
  let balance = opening;
  const rows = lines.map((l) => {
    balance += Number(l.debit) - Number(l.credit);
    return {
      id: l.transactionId,
      date: l.transaction.date,
      memo: l.transaction.memo,
      debit: l.debit,
      credit: l.credit,
      balance: balance.toFixed(2),
    };
  });

  return NextResponse.json({ opening, rows });
});
