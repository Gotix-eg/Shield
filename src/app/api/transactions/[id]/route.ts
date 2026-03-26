import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withCompany } from '@/lib/with-company';

function isAccountant(role: string | undefined): boolean {
  return role && ['ADMIN', 'ACCOUNTANT_MASTER', 'ACCOUNTANT_ASSISTANT', 'OWNER'].includes(role);
}

// DELETE /api/transactions/[id]
// Removes the transaction and all its lines (ON DELETE CASCADE in Prisma).
export const DELETE = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAccountant(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isNaN(txId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Ensure at least one line account belongs to this company
  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
    include: {
      lines: { include: { account: { select: { companyId: true } } } },
    },
  });
  const belongs = tx?.lines.some((l)=> l.account.companyId === companyId);
  if (!belongs) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await prisma.transaction.delete({ where: { id: txId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/transactions/[id]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
