import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// POST /api/banks/reset
// Deletes ALL BankTransaction records and sets all bank account balances to 0
// This is a destructive operation intended for test data cleanup
export async function POST(request: NextRequest) {
  const hdr = request.headers.get('authorization') || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const dec: any = jwt.verify(token, JWT_SECRET);
    const role = dec.role as string;
    if (role === 'STAFF') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all bank transactions
  const { count: deletedTxns } = await prisma.bankTransaction.deleteMany({});

  // Reset all bank account balances to 0
  const { count: resetBanks } = await prisma.bankAccount.updateMany({
    data: { balance: 0 },
  });

  return NextResponse.json({
    success: true,
    deletedTransactions: deletedTxns,
    resetBanks,
  });
}
