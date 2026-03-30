import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// POST /api/banks/recalculate
// Recalculates all bank balances from the sum of their BankTransaction records
// and resets the bankAccount.balance field to the correct value.
export async function POST(request: NextRequest) {
  const hdr = request.headers.get('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (token) {
    try {
      const dec: any = jwt.verify(token, JWT_SECRET);
      const role = dec.role as string;
      if (role === 'STAFF') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Get all bank accounts
  const banks = await prisma.bankAccount.findMany({
    include: { bankTransactions: { select: { amount: true } } },
  });

  const updates = await Promise.all(
    banks.map(async (bank) => {
      const correctBalance = bank.bankTransactions.reduce(
        (acc, t) => acc + Number(t.amount),
        0
      );
      await prisma.bankAccount.update({
        where: { id: bank.id },
        data: { balance: correctBalance },
      });
      return { id: bank.id, name: bank.name, oldBalance: Number(bank.balance), newBalance: correctBalance };
    })
  );

  return NextResponse.json({ recalculated: updates });
}
