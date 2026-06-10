import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  let role: string | null = null;
  let userId: number | null = null;

  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      role = payload.role;
      const claim = payload.sub ?? payload.id;
      if (claim) userId = Number(claim);
    } catch {}
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let companyId: number | null = null;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    companyId = u?.companyId || null;
  }

  if (!companyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 401 });
  }

  const where: Prisma.UserWhereInput = {
    role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
    OR: [
      { companyId },
      { role: "SUPER_ADMIN" }
    ]
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { id: "asc" }
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, password, role = "EDITOR" } = body as {
      name: string;
      email: string;
      phone?: string;
      address?: string;
      password: string;
      role?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let creatorCompanyId: number | null = null;
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      const creatorRole = payload.role;
      if (creatorRole !== "SUPER_ADMIN" && creatorRole !== "OWNER") {
        return NextResponse.json({ error: "Only Super Admin can add users" }, { status: 403 });
      }
      const creatorId = Number(payload.sub ?? payload.id);
      const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { companyId: true } });
      creatorCompanyId = creator?.companyId || null;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!creatorCompanyId) {
      return NextResponse.json({ error: "Creator company not found" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: role as any,
        company: { connect: { id: creatorCompanyId } },
        phone,
        address
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
