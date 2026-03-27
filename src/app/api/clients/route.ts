import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

import { withCompany } from '@/lib/with-company';

// GET all clients with company isolation
export const GET = withCompany(async (request: NextRequest, { companyId }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clientId = searchParams.get("id");

    if (clientId) {
      // single client
      const parsedId = parseInt(clientId);
      const client = await prisma.client.findFirst({ where: { id: parsedId, companyId } });
      if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
      return NextResponse.json(client);
    } else {
      // all clients for this company
      const clients = await prisma.client.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          phone: true,
          address: true,
          notes: true,
          createdAt: true,
          code: true,
          city: true,
          vatCode: true,
          country: true,
        }
      });
      return NextResponse.json(clients);
    }

  } catch (error: any) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
});

// POST create client
export const POST = withCompany(async (request: NextRequest, { companyId, userId }) => {
  try {
    if (!companyId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await request.json();

    if (!data.name || !data.contactEmail || !data.phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // generate unique code C0001, C0002 etc.
    // determine next sequence based on existing client codes OR AR accounts
    const lastClient = await prisma.client.findFirst({ where: { companyId }, orderBy: { id: 'desc' }, select: { code: true } });
    const lastAccount = await prisma.account.findFirst({
      where: { companyId, code: { startsWith: 'AR-C' } },
      orderBy: { id: 'desc' },
      select: { code: true },
    });
    const seqFromClient = lastClient?.code ? parseInt(lastClient.code.replace(/^C/, '')) : 0;
    const seqFromAccount = lastAccount?.code ? parseInt(lastAccount.code.replace(/^AR-C/, '')) : 0;
    const nextSeq = Math.max(seqFromClient, seqFromAccount) + 1;
    const code = `C${nextSeq.toString().padStart(4, '0')}`;

    // find or create AR account for the client to avoid duplicates
    let arAccount = await prisma.account.findFirst({ where: { code: `AR-${code}`, companyId } });
    if (!arAccount) {
      arAccount = await prisma.account.create({
        data: {
          code: `AR-${code}`,
          name: `${code} Receivable`,
          type: 'ASSET',
          companyId,
        },
      });
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address || "",
        city: data.city || "",
        vatCode: data.vatCode || "",
        country: data.country || "",
        notes: data.notes || "",
        owner: { connect: { id: userId } },
        code,
        account: { connect: { id: arAccount.id } },
        company: { connect: { id: companyId } }
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Client already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to create client", details: error.meta },
      { status: 500 }
    );
  }
});