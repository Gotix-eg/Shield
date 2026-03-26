import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const limiter = rateLimit(ip, 3, 3600000); // 3 attempts per hour
    if (!limiter.success) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, password, companyName } = body as {
      name?: string;
      email?: string;
      password?: string;
      companyName?: string;
    };


    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // Password complexity check
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json({ 
        error: "Password must contain uppercase, lowercase, number, and special character" 
      }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ensure company name is unique
    const existingCompany = await prisma.company.findUnique({ where: { name: companyName } });
    if (existingCompany) {
      return NextResponse.json({ error: "Company name already exists" }, { status: 409 });
    }

    // create new company tenant first
    const company = await prisma.company.create({
      data: { name: companyName },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "OWNER",
        companyId: company.id,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("/api/register error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
