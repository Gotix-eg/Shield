import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCompany } from "@/lib/with-company";

// GET list entries
export const GET = withCompany(async (request: NextRequest, { companyId, userId }) => {
  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.timeEntry.findMany({
    where: { 
      userId,
      project: { companyId }
    },
    include: {
      project: {
        include: { client: true },
      },
    },
    orderBy: { startTs: "desc" },
  });
  return NextResponse.json(entries);
});

// POST create new entry
export const POST = withCompany(async (request: NextRequest, { companyId, userId }) => {
  if (!companyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, startTs, endTs, notes, billable = true } = await request.json();
  if (!projectId || !startTs)
    return NextResponse.json({ error: "projectId and startTs required" }, { status: 400 });

  // verify assignment exists and project belongs to company
  const assignment = await prisma.projectAssignment.findFirst({
    where: { 
      projectId, 
      userId, 
      canLogTime: true,
      project: { companyId }
    },
    include: { project: true }
  });
  if (!assignment) return NextResponse.json({ error: "Not assigned to project or access denied" }, { status: 403 });

  const startDate = new Date(startTs);
  const endDate = endTs ? new Date(endTs) : null;
  const durationMins = endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : 0;

  const entry = await prisma.timeEntry.create({
    data: {
      projectId,
      userId,
      startTs: startDate,
      endTs: endDate,
      durationMins,
      notes,
      billable,
    },
  });
  await import('@/lib/notify').then(m=>m.notifyRole('ACCOUNTANT_MASTER',`وقت جديد بإنتظار الموافقة للمشروع #${projectId}`,'TIME_PENDING'));
  return NextResponse.json(entry, { status: 201 });
});
