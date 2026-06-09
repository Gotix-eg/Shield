import { NextRequest, NextResponse } from "next/server";
import { prisma as tenantDb } from "@/lib/prisma";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const consultation = await tenantDb.consultationRequest.findFirst({
      where: { id },
    });
    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }
    return NextResponse.json(consultation);
  } catch (error) {
    console.error("GET /api/website/consultations/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch consultation" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, notes } = body;

    const existing = await tenantDb.consultationRequest.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    const updated = await tenantDb.consultationRequest.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/website/consultations/[id] error:", error);
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyWebsiteAuth(req);
  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const existing = await tenantDb.consultationRequest.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    await tenantDb.consultationRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/website/consultations/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete consultation" }, { status: 500 });
  }
}
