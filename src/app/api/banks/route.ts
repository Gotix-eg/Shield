import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';


// GET /api/banks
export const GET = withCompany(async (request: NextRequest, { companyId }) => {
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rawBanks = await prisma.bankAccount.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
    include: {
      bankTransactions: { select: { amount: true } },
      advancePayments: { select: { amount: true } },
    },
  });
  const banks = rawBanks.map((b) => {
    const sumTxns = b.bankTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
    const sumAdv = b.advancePayments.reduce((acc, a) => acc + Number(a.amount), 0);
    const derived = sumTxns + sumAdv;
    return {
      id: b.id,
      name: b.name,
      currency: b.currency,
      balance: Number(b.balance),
      derived,
    };
  });
  return NextResponse.json(banks);
});

// POST /api/banks { companyId, name, currency }
export const POST = withCompany(async (request: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  if (role !== 'ADMIN' && role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, currency } = await request.json();
    if (!name || !currency) return NextResponse.json({ error: 'Missing name or currency' }, { status: 400 });
    const bank = await prisma.bankAccount.create({
      data: { companyId, name, currency },
    });
    return NextResponse.json(bank, { status: 201 });
  } catch (err) {
    console.error('Failed to create bank:', err);
    return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 });
  }
});
