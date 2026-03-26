import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const GET = withCompany(async (request: NextRequest, { companyId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const id = Number(idStr);
  
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const client = await prisma.client.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        phone: true,
        address: true,
        notes: true,
        city: true,
        vatCode: true,
        country: true,
        createdAt: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});

export const PUT = withCompany(async (request: NextRequest, { companyId, userId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const id = Number(idStr);

  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const data = await request.json();
  const existing = await prisma.client.findFirst({ where: { id, companyId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.client.update({ where: { id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withCompany(async (request: NextRequest, { companyId, userId }) => {
  const idStr = request.nextUrl.pathname.split('/').pop() || '';
  const id = Number(idStr);

  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const exists = await prisma.client.findFirst({ where: { id, companyId } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
});
  // check related records
  const [invoiceCount, projectCount] = await Promise.all([
    prisma.invoice.count({ where: { clientId: id } }),
    prisma.project.count({ where: { clientId: id } }),
  ]);
  if (invoiceCount > 0 || projectCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete client with related records" },
      { status: 400 }
    );
  }
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === "P2003") {
      // Foreign key constraint fails
      return NextResponse.json({ error: "Cannot delete client with related records" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
