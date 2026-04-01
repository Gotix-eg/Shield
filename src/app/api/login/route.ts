import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

export async function POST(request: NextRequest) {
  try {
    const { email, password, captchaToken } = (await request.json()) as {
      email?: string;
      password?: string;
      captchaToken?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // ── Verify reCAPTCHA ─────────────────────────────────────────────────────
    if (!captchaToken) {
      return NextResponse.json({ error: "CAPTCHA verification required." }, { status: 400 });
    }
    const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET}&response=${captchaToken}`,
    });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // ── SUPER_ADMIN bypasses all company checks ───────────────────────────
    if ((user.role as string) !== "SUPER_ADMIN" && user.companyId) {
      const company = await prisma.company.findUnique({ where: { id: user.companyId } });

      if (company) {
        // 1. Suspended
        if ((company as any).status === "SUSPENDED") {
          return NextResponse.json(
            { error: "Your firm account has been suspended. Please contact support." },
            { status: 403 }
          );
        }

        // 2. Subscription expired
        const subEnds = (company as any).subscriptionEnds as Date | null;
        if (subEnds && new Date() > new Date(subEnds)) {
          return NextResponse.json(
            { error: "Your subscription has expired. Please renew to continue." },
            { status: 403 }
          );
        }

        // 3. Seat limit — count all users in the company
        const maxSeats: number = (company as any).maxSeats ?? 3;
        const seatCount = await prisma.user.count({ where: { companyId: user.companyId } });
        if (seatCount > maxSeats) {
          return NextResponse.json(
            { error: `Your firm has reached the maximum allowed users (${maxSeats}). Please contact your administrator.` },
            { status: 403 }
          );
        }
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const res = NextResponse.json({ token }, { status: 200 });
    res.headers.set(
      "Set-Cookie",
      `token=${token}; Max-Age=28800; Path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );
    return res;
  } catch (err) {
    console.error("/api/login error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
