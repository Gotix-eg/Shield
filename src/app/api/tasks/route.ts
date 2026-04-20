import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions, getAuthServer } from '@/lib/auth';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// GET /api/tasks -> list tasks for current user (or all if admin)
export async function GET(req: NextRequest) {
  let session = await getServerSession(authOptions);
  if (!session?.user) {
    // try bearer / custom token
    const raw = getAuthServer(req);
    if (raw) {
      try {
        const decoded = jwt.verify(raw, JWT_SECRET) as any;
        session = { user: decoded } as any;
      } catch {}
    }
  }
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const role = session.user.role as string;
  const isManager = ['LAWYER_PARTNER','MANAGING_PARTNER','LAWYER_MANAGER','OWNER','ADMIN'].includes(role);

  // base filter by company
  const companyId = (session.user as any).companyId;
  const companyFilter = companyId
    ? {
        OR: [
          { project: { companyId } },
          { client: { companyId } },
        ],
      }
    : {};

  // user-level filter (non-managers see their tasks)
  const userId = session.user.id;
  const userFilter = isManager ? {} : { 
    assigneeIds: { contains: String(userId) }
  };

  const tasks = await prisma.task.findMany({
    where: { ...companyFilter, ...userFilter },
    include: {
      client: { select: { name: true, id: true } },
      project: { select: { name: true, id: true } },
      assigner: { select: { name: true, id: true } },
      agent: { select: { name: true, id: true } }
    },
    orderBy: { dueDate: 'asc' }
  });

  // Fetch assignee users for each task
  const tasksWithAssignees = await Promise.all(tasks.map(async (task) => {
    const assigneeIds = task.assigneeIds.split(',').map(Number).filter(Boolean);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true }
    });
    return { ...task, assignee: assignees[0], assignees };
  }));

  return NextResponse.json(tasksWithAssignees);
}

// POST /api/tasks -> create new task
export async function POST(req: NextRequest) {
  let session = await getServerSession(authOptions);
  if (!session?.user) {
    // try bearer/JWT token
    // attempt custom JWT cookie "token"
    const raw = getAuthServer(req as any);
    if (raw) {
      try {
        const decoded = jwt.verify(raw, JWT_SECRET) as any;
        session = { user: decoded } as any;
      } catch {}
    }
  }
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const role = (session.user as any).role as string;
  if (!['LAWYER_PARTNER','MANAGING_PARTNER','MANAGING_PARTNER','OWNER','ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await req.json();
  const { title, description, taskType, ipType, isAgent, agentId, defendantName, opponent, court, clientId, projectId, assigneeIds, dueDate } = data;
  
  if (!title || !assigneeIds || !dueDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const assigneeIdArray = Array.isArray(assigneeIds) ? assigneeIds.map(Number) : [Number(assigneeIds)];
  const assigneeIdsStr = assigneeIdArray.join(',');

  const task = await prisma.task.create({
    data: {
      title,
      description,
      taskType,
      ipType,
      isAgent: isAgent ?? false,
      agentId: agentId ? Number(agentId) : null,
      defendantName,
      opponent,
      court,
      clientId: clientId ? Number(clientId) : null,
      projectId: projectId ? Number(projectId) : null,
      assignerId: session.user.id,
      assigneeIds: assigneeIdsStr,
      dueDate: new Date(dueDate),
    }
  });

  // Create notifications and project assignments for each assignee
  for (const assigneeId of assigneeIdArray) {
    if (projectId) {
      await prisma.projectAssignment.upsert({
        where: { userId_projectId: { userId: assigneeId, projectId: Number(projectId) } },
        create: { userId: assigneeId, projectId: Number(projectId) },
        update: {},
      });
    }
    await prisma.notification.create({ data: { userId: assigneeId, type: 'TASK_ASSIGN', message: `You were assigned task "${title}"` } });
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select:{ email:true } });
    if (assignee?.email) {
      try { await import('@/lib/email').then(m=>m.sendMail(assignee.email, 'New Task Assigned', `<p>You have a new task: <b>${title}</b></p>`)); } catch {}
    }
  }
  return NextResponse.json(task, { status: 201 });
}
