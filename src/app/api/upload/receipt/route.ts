import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';
import crypto from 'crypto';

export const runtime = "nodejs";

// POST /api/upload/receipt
export const POST = withCompany(async (req: NextRequest, { companyId, userId }) => {
  try {
    if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const expenseIdRaw = formData.get('expenseId');
    const expenseId = expenseIdRaw ? Number(expenseIdRaw) : null;
    
    if (expenseId) {
      // Verify expense belongs to this company
      const expense = await prisma.expense.findFirst({
        where: { id: expenseId, project: { companyId } }
      });
      if (!expense) return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    // upload to Vercel Blob
    const ext = file.name.split('.').pop() || 'dat';
    const key = `receipts/${crypto.randomUUID()}.${ext}`;

    const { url } = await put(key, file, {
      access: 'public',
      token: process.env.BLOB_RW_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (expenseId) {
      await prisma.expense.update({ where: { id: expenseId }, data: { receiptUrl: url } });
    }
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('upload receipt error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});
