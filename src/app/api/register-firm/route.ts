import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/register-firm — public endpoint, creates company in DEMO mode
export async function POST(req: NextRequest) {
  try {
    const { firmName, ownerName, email, password } = await req.json();
    if (!firmName || !ownerName || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    // Check duplicate firm name
    const existingFirm = await prisma.company.findUnique({ where: { name: firmName } });
    if (existingFirm) return NextResponse.json({ error: 'Firm name already taken' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);

    // Create company in DEMO mode
    const company = await prisma.company.create({
      data: {
        name: firmName,
        registeredEmail: email,
        status: 'DEMO' as any,
        maxSeats: 3,
      },
    });

    // Create ADMIN user for the firm (owner)
    await prisma.user.create({
      data: {
        name: ownerName,
        email,
        passwordHash: hash,
        role: 'ADMIN',
        companyId: company.id,
      },
    });

    return NextResponse.json({ message: 'Firm registered in Demo mode. Awaiting activation.' }, { status: 201 });
  } catch (err: any) {
    console.error('register-firm error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
