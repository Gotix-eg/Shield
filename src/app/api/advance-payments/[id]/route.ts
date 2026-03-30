import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function getUserId(request: NextRequest): number | null {
  let token: string | null = null;
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token) token = request.cookies.get('token')?.value || null;
  if (!token) return null;
  // if token is just a numeric user id stored in localStorage/cookie
  if (/^\d+$/.test(token)) {
    return Number(token);
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload | string;
    if (typeof decoded === 'string') {
      return Number(decoded);
    }
    const payload = decoded as any;
    return Number(payload.id ?? payload.sub);
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  const payment = await prisma.advancePayment.findUnique({ where: { id }, include: { project: true } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'STAFF' && payment.project.ownerId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // reverse side effects
  await prisma.$transaction(async (tx) => {
    await tx.advancePayment.delete({ where: { id } });
    if (payment.bankId) {
      await tx.bankAccount.update({ where: { id: payment.bankId }, data: { balance: { decrement: payment.amount } } });
    }
    if (payment.accountType === 'EXPENSE') {
      const trustAcct = await tx.trustAccount.findFirst({ where: { projectId: payment.projectId, currency: payment.currency } });
      if (trustAcct) {
        await tx.trustAccount.update({ where: { id: trustAcct.id }, data: { balance: { decrement: payment.amount } } });
        await tx.trustTransaction.create({ data: { trustAccountId: trustAcct.id, projectId: payment.projectId, txnType: 'DEBIT', amount: payment.amount, description: `Delete advance payment ${payment.id}` } });
      }
    }
    // remove from ledger
    await tx.incomeCashLedger.deleteMany({ where: { source: 'TRUST_DEPOSIT', projectId: payment.projectId, amount: payment.amount, currency: payment.currency } });
  });
  return NextResponse.json({ ok: true });
}

// PUT to edit amount/currency/notes/bankId
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const { amount, currency, notes, paidOn, bankId: rawBankId } = body;

  // fetch the existing payment to know the old bankId + amount
  const existing = await prisma.advancePayment.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const newBankId  = rawBankId !== undefined ? (rawBankId ? Number(rawBankId) : null) : existing.bankId;
  const newAmount  = amount !== undefined ? Number(amount) : Number(existing.amount);
  const newCurrency = currency || existing.currency;
  const oldBankId  = existing.bankId;
  const oldAmount  = Number(existing.amount);

  // Build update data
  const data: any = {};
  if (amount   !== undefined) data.amount   = newAmount;
  if (currency)               data.currency = newCurrency;
  if (notes    !== undefined) data.notes    = notes;
  if (paidOn)                 data.paidOn   = new Date(paidOn);
  if (rawBankId !== undefined) data.bankId  = newBankId;

  const payment = await prisma.advancePayment.update({ where: { id }, data });

  // ── Update bank balances ──
  const bankOps: any[] = [];

  // Reverse old bank if it's changing or amount changed
  if (oldBankId && (oldBankId !== newBankId || oldAmount !== newAmount)) {
    bankOps.push(
      prisma.bankAccount.update({
        where: { id: oldBankId },
        data: { balance: { decrement: oldAmount } },
      })
    );
  }

  // Apply new bank
  if (newBankId) {
    const isNewBank = newBankId !== oldBankId;
    const amountToAdd = isNewBank ? newAmount : (newAmount - oldAmount);

    if (isNewBank || oldAmount !== newAmount) {
      const memo = `Advance payment update – Project #${existing.projectId}${notes ? ': ' + notes : ''}`;
      bankOps.push(
        prisma.bankAccount.update({
          where: { id: newBankId },
          data: { balance: { increment: isNewBank ? newAmount : amountToAdd } },
        }),
        prisma.bankTransaction.create({
          data: {
            bankId: newBankId,
            amount: isNewBank ? newAmount : amountToAdd,
            currency: newCurrency,
            memo,
            companyId: existing.project.companyId,
          },
        })
      );
    }
  }

  if (bankOps.length > 0) {
    await prisma.$transaction(bankOps);
  }

  return NextResponse.json(payment);
}

