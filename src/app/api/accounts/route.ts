import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';
import { ensureStandardChart } from '@/lib/coa';

function isAdmin(role: string | undefined): boolean {
  return !!role && ['ADMIN', 'ACCOUNTANT_MASTER', 'OWNER'].includes(role);
}

export const GET = withCompany(async (request: NextRequest, { companyId }) => {
  // if the request lacks a company context, return an empty list instead of leaking
  // accounts that belong to other tenants.
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Seed standard chart of accounts (law-firm specific)
  await ensureStandardChart(companyId);


  // ---------------------------------------------------------------------------
  // Return accounts (optionally with balances)
  // ---------------------------------------------------------------------------
  const withBalances = request.nextUrl.searchParams.get('withBalances') === '1';
  if (!withBalances) {
    const accounts = await prisma.account.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
    return NextResponse.json(accounts);
  }
  // fetch balances per account & currency
  const balancesRaw = await prisma.transactionLine.groupBy({
    // @ts-ignore
    where: { account: { companyId } },

    by: ['accountId', 'currency'],
    _sum: { debit: true, credit: true },
  });
  const balanceMap: Record<string, { currency: string; balance: number }[]> = {};
  balancesRaw.forEach((b) => {
    const net = Number(b._sum.debit ?? 0) - Number(b._sum.credit ?? 0);
    const list = balanceMap[b.accountId] ?? (balanceMap[b.accountId] = []);
    list.push({ currency: b.currency, balance: net });
  });
  const accounts = await prisma.account.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
  const result = accounts.map((a) => ({ ...a, balances: balanceMap[a.id] ?? [] }));
  return NextResponse.json(result);
});

// POST create manual account
export const POST = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { code, name, type } = await req.json();
  if (!code || !name || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  try {
    // @ts-ignore
    const account = await prisma.account.create({ data: { code, name, type, companyId } });
    return NextResponse.json(account, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
