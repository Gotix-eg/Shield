import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    const data: any = { name, email, phone, address };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (role) data.role = role;

    const updated = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
