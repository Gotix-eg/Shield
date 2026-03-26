import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withCompany } from '@/lib/with-company';

// GET /api/tasks -> list tasks for current user (or all if admin)
export const GET = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isManager = role && ['LAWYER_PARTNER','MANAGING_PARTNER','LAWYER_MANAGER','OWNER','ADMIN'].includes(role);

  // base filter by company
  const companyFilter = {
    OR: [
      { project: { companyId } },
      { client: { companyId } },
    ],
  };

  // user-level filter (non-managers see only tasks assigned to them)
  const userFilter = isManager ? {} : { assigneeId: userId };

  const tasks = await prisma.task.findMany({
    where: { ...companyFilter, ...userFilter },
    include: {
      client: { select: { name: true, id: true } },
      project: { select: { name: true, id: true } },
      assignee: { select: { name: true, id: true } },
      assigner: { select: { name: true, id: true } }
    },
    orderBy: { dueDate: 'asc' }
  });

  return NextResponse.json(tasks);
});

// POST /api/tasks -> create new task
export const POST = withCompany(async (req: NextRequest, { companyId, userId, role }) => {
  if (!companyId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  if (!role || !['LAWYER_PARTNER','MANAGING_PARTNER','LAWYER_MANAGER','OWNER','ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const data = await req.json();
  const { title, description, clientId, projectId, assigneeId, dueDate } = data;
  if (!title || !assigneeId || !dueDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify client/project belong to company
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: Number(clientId), companyId } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: Number(projectId), companyId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      clientId: clientId ? Number(clientId) : null,
      projectId: projectId ? Number(projectId) : null,
      assignerId: userId,
      assigneeId: Number(assigneeId),
      dueDate: new Date(dueDate),
    }
  });
  
  if (projectId) {
    await prisma.projectAssignment.upsert({
      where: { userId_projectId: { userId: Number(assigneeId), projectId: Number(projectId) } },
      create: { userId: Number(assigneeId), projectId: Number(projectId) },
      update: {},
    });
  }
  return NextResponse.json(task, { status: 201 });
});  await prisma.notification.create({ data: { userId: assigneeId, type: 'TASK_ASSIGN', message: `You were assigned task "${title}"` } });
  // send email if user has email
  const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select:{ email:true } });
  if (assignee?.email) {
    try { await import('@/lib/email').then(m=>m.sendMail(assignee.email, 'New Task Assigned', `<p>You have a new task: <b>${title}</b></p>`)); } catch {}
  }
  return NextResponse.json(task, { status: 201 });
}
