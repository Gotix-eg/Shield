import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function auth(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return { id: Number(payload.sub ?? payload.id), role: payload.role };
  } catch {
    return null;
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    const body = await req.json();
    const { name, email, phone, address, password, role } = body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      password?: string;
      role?: string;
    };

    const currentUser = auth(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuper = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
    const isSelf = currentUser.id === id;

    if (!isSuper && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = { name, email, phone, address };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (role && isSuper) data.role = role;

    const updated = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);

    const currentUser = auth(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuper = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";
    if (!isSuper) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
