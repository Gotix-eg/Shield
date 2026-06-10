import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ensure core permissions exist
  const corePerms = [
    { code: "edit_hero", name: "Edit Hero Section" },
    { code: "edit_about", name: "Edit About Section" },
    { code: "edit_team", name: "Edit Team Members" },
    { code: "edit_practices", name: "Edit Practice Areas" },
    { code: "edit_awards", name: "Edit Awards & Accolades" },
    { code: "edit_contact", name: "Edit Contact Info" },
    { code: "edit_faq", name: "Edit FAQs (Chatbot)" },
    { code: "edit_slots", name: "Edit Schedule Slots" },
    { code: "edit_portal_cases", name: "Edit Client Case Tracker" },
    { code: "view_consultations", name: "View Consultation Inbox" },
    { code: "view_inquiries", name: "View Contact Inquiries" }
  ];

  for (const perm of corePerms) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm
    });
  }

  // List all possible permissions
  const permissions = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
  return NextResponse.json(permissions);
}
