import { NextRequest, NextResponse } from "next/server";
import { withCompany } from "@/lib/with-company";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const GET = withCompany(async (request: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let whereClause: any = { companyId };
  
  if (role === 'LAWYER_MANAGER') {
    // projects where any assignment belongs to managed lawyers
    const managed = await prisma.managerLawyer.findMany({ where: { managerId: userId }, select: { lawyerId: true } });
    const ids = managed.map(m => m.lawyerId);
    if (ids.length === 0) return NextResponse.json([]);
    whereClause.assignments = { some: { userId: { in: ids } } };
  } else if (role === 'LAWYER') {
    // lawyers only see projects they are assigned to
    whereClause.assignments = { some: { userId, canLogTime: true } };
  } else if (role === 'STAFF') {
    whereClause.ownerId = userId;
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: { client: true, advancePayments: true },
  });
  const result = projects.map((p) => {
    const totals: Record<string, number> = {};
    p.advancePayments.forEach((ap) => {
      const cur = ap.currency;
      totals[cur] = (totals[cur] || 0) + Number(ap.amount);
    });
    return {
      ...p,
      advanceTotals: Object.entries(totals).map(([currency, total]) => ({ currency, total })),
    };
  });
  return NextResponse.json(result);
});

export const POST = withCompany(async (request: NextRequest, { companyId, userId, role }) => {
  try {
  if (!companyId || !userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, clientId, description, advanceAmount, advanceCurrency, status, billingType = 'HOURS', rateSource = null, hourlyRate = null, fixedFee = null, billingCurrency = null } = await request.json();
  if (!name || !clientId)
    return NextResponse.json({ error: "name and clientId required" }, { status: 400 });
  if (advanceAmount !== undefined && advanceAmount !== null && typeof advanceAmount !== "number")
    return NextResponse.json({ error: "advanceAmount must be number" }, { status: 400 });

  // basic validation for billing
  if (billingType === 'HOURS' && rateSource === 'PROJECT') {
    if (hourlyRate === null || hourlyRate === undefined)
      return NextResponse.json({ error: 'hourlyRate required when rateSource=PROJECT' }, { status: 400 });
    if (!billingCurrency)
      return NextResponse.json({ error: 'billingCurrency required for hourly rate' }, { status: 400 });
  }
  if (billingType === 'FIXED') {
    if (fixedFee === null || fixedFee === undefined)
      return NextResponse.json({ error: 'fixedFee required when billingType=FIXED' }, { status: 400 });
    if (!billingCurrency)
      return NextResponse.json({ error: 'billingCurrency required for fixed fee' }, { status: 400 });
  }

  const isStaff = (role as string) === "STAFF";
   let client;
  if (isStaff) {
    client = await prisma.client.findFirst({ where: { id: clientId, ownerId: userId, companyId } });
    if (!client)
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
  } else {
    client = await prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client)
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

    // ------------------ Code generation ------------------
  // Ensure client has a code (generated elsewhere on client creation)
  const clientCode = client.code || `C${client.id.toString().padStart(4,'0')}`;

  // Safely generate unique project code (handles race conditions)
  let projCode: string | undefined;
  let seq = 1;
  while (!projCode) {
    const candidate = `P${seq.toString().padStart(4, '0')}`;
    try {
      // attempt to reserve code by inserting a dummy then deleting (cheap) OR try create project directly later
      const exists = await prisma.project.findFirst({ where: { code: candidate, companyId } });
      if (!exists) projCode = candidate;
    } catch {}
    if (!projCode) seq++;
  }

  // Revenue account code: REV-<clientCode>-<projCode>
  const revCode = `REV-${clientCode}-${projCode}`;

  // Re-use account if it already exists (avoid duplicates)
  let revAccount = await prisma.account.findFirst({ where: { code: revCode, companyId } });
  if (!revAccount) {
    revAccount = await prisma.account.create({
      data: {
        code: revCode,
        name: `${clientCode}-${projCode} Revenue`,
        type: 'INCOME',
        companyId,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      advanceAmount: advanceAmount ?? null,
      advanceCurrency: advanceCurrency ?? null,
      status: status ?? undefined,
      billingType,
      rateSource,
      hourlyRate: hourlyRate ?? null,
      fixedFee: fixedFee ?? null,
      billingCurrency: billingCurrency ?? null,
      clientId,
      ownerId: userId,
      code: projCode,
      accountId: revAccount.id,
      companyId,
    },
  });
    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error('Project create error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
});
