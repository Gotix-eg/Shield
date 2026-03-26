import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postTransaction } from '@/lib/gl';
import { withCompany } from '@/lib/with-company';
import jwt from 'jsonwebtoken';

function requireAdmin(role: string | undefined) {
  return role && ['ADMIN', 'OWNER', 'ACCOUNTANT_MASTER'].includes(role);
}

// POST /api/admin/fix-trust-cash  { currency:'EGP' }
export const POST = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { currency = 'EGP' } = await req.json();

  // balances
  const bank = await prisma.account.findFirst({ where: { companyId, code: '1010' } });
  const trustCash = await prisma.account.findFirst({ where: { companyId, code: '1020' } });
  if (!bank || !trustCash) return NextResponse.json({ error: 'Accounts missing' }, { status: 404 });

  const result = await prisma.transactionLine.groupBy({
    by: [],
    where: { accountId: bank.id, currency },
    _sum: { debit: true, credit: true },
  });
  const bal = result[0] ? Number(result[0]._sum.debit || 0) - Number(result[0]._sum.credit || 0) : 0;
  if (bal <= 0) return NextResponse.json({ message: 'No positive balance to move' });

  await postTransaction({
    memo: `Move legacy trust cash to 1020`,
    createdBy: undefined,
    lines: [
      { accountId: trustCash.id, debit: bal, currency },
      { accountId: bank.id, credit: bal, currency },
    ],
  });

  return NextResponse.json({ moved: bal, currency });
});
