import { NextRequest, NextResponse } from 'next/server';
import { withCompany } from '@/lib/with-company';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET /api/trust-accounts?clientId=123
// Returns list of trust accounts with computed balances.
// Safely skips projects that do not define advanceCurrency to avoid null currency errors.
export const GET = withCompany(async (req: NextRequest, { companyId, role }) => {
  try {
    if (!companyId || !role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = req.nextUrl.searchParams.get('clientId');
    const typeParam = req.nextUrl.searchParams.get('type');
    const projectIdParam = req.nextUrl.searchParams.get('projectId');
    const currencyParam = req.nextUrl.searchParams.get('currency');

    const where: any = {
      client: { companyId }
    };
    if (clientId) where.clientId = Number(clientId);
    if (projectIdParam) where.projectId = Number(projectIdParam);
    if (typeParam) {
      where.accountType = typeParam.toUpperCase();
    } else {
      where.accountType = { not: 'TRUST' } as any;
    }
    if (currencyParam) where.currency = currencyParam.toUpperCase();

    const raw = await prisma.trustAccount.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        transactions: true,
      },
    });

    const accounts = raw.map((a) => ({
      id: a.id,
      client: a.client,
      project: a.project,
      accountType: a.accountType,
      currency: a.currency,
      balance: (() => {
        const sum = a.transactions.reduce((acc, t) => {
          const val = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount.toString());
          return t.txnType === 'DEBIT' ? acc - val : acc + val;
        }, 0);

        return sum === 0 ? Number(a.balance) : sum;
      })(),
    }));
    return NextResponse.json(accounts);
  } catch (err) {
    console.error('GET /api/trust-accounts', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});

// POST /api/trust-accounts  { clientId, currency }
export const POST = withCompany(async (req: NextRequest, { companyId, role }) => {
  if (!companyId || !role || role === 'STAFF') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const body = await req.json();
  const { clientId, projectId = null, currency = 'USD', accountType = 'TRUST' } = body;
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  // Verify client belongs to company
  const client = await prisma.client.findFirst({ where: { id: clientId, companyId } });
  if (!client) return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });

  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!project) return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  // ensure one account per client/project/currency/type
  const exists = await prisma.trustAccount.findUnique({ 
    where: { 
      clientId_projectId_currency_accountType: { 
        clientId, 
        projectId, 
        currency, 
        accountType 
      } 
    } 
  });
  if (exists) return NextResponse.json(exists);

  const acct = await prisma.trustAccount.create({ 
    data: { 
      clientId, 
      projectId, 
      currency,
      accountType
    } 
  });
  return NextResponse.json(acct, { status: 201 });
});
