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

  let userFilter: any = { assigneeId: userId };
  if (isManager) userFilter = {};

  if (role === 'LAWYER_MANAGER' || role === 'LAWYER_PARTNER') {
    const managed = await prisma.managerLawyer.findMany({ where: { managerId: userId }, select: { lawyerId: true } });
    const ids = managed.map(m => m.lawyerId);
    const allowedAssignees = role === 'LAWYER_PARTNER' ? [userId, ...ids] : ids;
    userFilter = { assigneeId: { in: allowedAssignees.length ? allowedAssignees : [userId] } };
  }

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
  
  if (!role || !['LAWYER_PARTNER','MANAGING_PARTNER','LAWYER_MANAGER','OWNER','ADMIN','LAWYER'].includes(role)) {
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

  // Verify assignee belongs to company
  const assignee = await prisma.user.findFirst({ where: { id: Number(assigneeId), companyId } });
  if (!assignee) return NextResponse.json({ error: 'Assignee not found in this company' }, { status: 404 });

  if (role === 'LAWYER') {
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const assigned = await prisma.projectAssignment.findFirst({ where: { userId, projectId: Number(projectId) } });
    if (!assigned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (role === 'LAWYER_MANAGER' || role === 'LAWYER_PARTNER') {
    const managed = await prisma.managerLawyer.findMany({ where: { managerId: userId }, select: { lawyerId: true } });
    const ids = managed.map(m => m.lawyerId);
    const allowedAssignees = role === 'LAWYER_PARTNER' ? [userId, ...ids] : ids;
    if (!allowedAssignees.includes(Number(assigneeId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

  // create notification and send email
  try {
    await prisma.notification.create({ 
      data: { 
        userId: Number(assigneeId), 
        type: 'TASK_ASSIGN', 
        message: `You were assigned task "${title}"` 
      } 
    });
    
    const assignee = await prisma.user.findUnique({ where: { id: Number(assigneeId) }, select: { email: true } });
    if (assignee?.email) {
      await import('@/lib/email').then(m => m.sendMail(assignee.email!, 'New Task Assigned', `<p>You have a new task: <b>${title}</b></p>`));
    }
  } catch (err) {
    console.error('Task notification/email failed', err);
  }

  return NextResponse.json(task, { status: 201 });
});
