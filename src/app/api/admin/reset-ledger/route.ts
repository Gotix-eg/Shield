import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';
import { ensureStandardChart } from '@/lib/coa';
import jwt from 'jsonwebtoken';

function isAdmin(role: string | undefined) {
  return role && ['ADMIN', 'OWNER', 'ACCOUNTANT_MASTER'].includes(role);
}

// POST /api/admin/reset-ledger  -> wipes accounts, transactions & advance payments for company then reseeds standard COA
export const POST = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isAdmin(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // 1. Delete transaction lines & transactions for company accounts
    const accountIds = await prisma.account.findMany({ where: { companyId }, select: { id: true } });
    const ids = accountIds.map((a) => a.id);
    if (ids.length) {
      await prisma.transactionLine.deleteMany({ where: { accountId: { in: ids } } });
    }
    await prisma.transaction.deleteMany({
      where: {
        lines: { none: {} }, // delete orphan transactions if any remain (safety)
      },
    });

    // 2. Delete advance payments & trust transactions linked to company projects
    const projects = await prisma.project.findMany({ where: { companyId }, select: { id: true } });
    const pids = projects.map((p) => p.id);
    if (pids.length) {
      await prisma.advancePayment.deleteMany({ where: { projectId: { in: pids } } });
      await prisma.trustTransaction.deleteMany({ where: { projectId: { in: pids } } });
    }

    // 3. Delete accounts (will cascade some relations)
    await prisma.account.deleteMany({ where: { companyId } });

    // 4. Reseed standard COA
    await ensureStandardChart(companyId);

    return NextResponse.json({ status: 'ok', message: 'Ledger reset & standard chart reseeded' });
  } catch (e: any) {
    console.error('reset-ledger error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
});
