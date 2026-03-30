import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function getUserId(req: NextRequest): number | null {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const dec: any = jwt.verify(token, JWT_SECRET);
    return Number(dec.sub ?? dec.id);
  } catch { return null; }
}

// POST /api/upload/document
// Fields: file (File), projectId? (number)
// Uploads to Vercel Blob, stores a Document record, returns { id, url, filename }
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const projectIdRaw = formData.get('projectId');
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;

  // Validate file type
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png', 'image/jpeg', 'image/webp',
  ];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed. Use PDF, Word, or Excel.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'dat';
  const key = `project-docs/${projectId ?? 'draft'}/${crypto.randomUUID()}.${ext}`;

  const { url } = await put(key, file, {
    access: 'public',
    token: process.env.BLOB_RW_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
  });

  // Get project's clientId if available
  let clientId: number | null = null;
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } });
    clientId = project?.clientId ?? null;
  }

  const doc = await prisma.document.create({
    data: {
      filename: file.name,
      mimeType: file.type,
      storageKey: url,
      sizeBytes: file.size,
      uploaderId: userId,
      projectId,
      clientId,
    },
  });

  return NextResponse.json({ id: doc.id, url, filename: file.name, mimeType: file.type, sizeBytes: file.size }, { status: 201 });
}

// GET /api/upload/document?projectId=X
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const docs = await prisma.document.findMany({
    where: { projectId: Number(projectId) },
    orderBy: { createdAt: 'desc' },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, storageKey: true, createdAt: true },
  });

  return NextResponse.json(docs);
}

// DELETE /api/upload/document?id=X
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
