import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret';

async function sendReminder(task: any, type: '48h' | '24h', recipients: { email?: string | null; name?: string | null }[]) {
  const timeLeft = type === '48h' ? 'يومين' : 'يوم واحد';
  const subject = type === '48h' ? '⏰ تذكير مهمة تنتهي بعد يومين' : '⏰ تذكير مهمة تنتهي غداً';
  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const html = `<p>مرحباً ${recipient.name},</p>
<p>تبقّى ${timeLeft} على إنجاز المهمة: <strong>${task.title}</strong>.</p>
<p>الموعد النهائي: ${task.dueDate.toLocaleDateString('ar-EG')}</p>
<p>أنشأ هذه المهمة: ${task.assigner?.name || 'غير محدد'}</p>`;
    try {
      await sendMail(recipient.email, subject, html);
    } catch {}
  }
}

export async function GET(req:NextRequest){
  const auth = req.headers.get('authorization') || '';
  const secretQs = new URL(req.url).searchParams.get('secret');
  const valid = auth === `Bearer ${CRON_SECRET}` || secretQs === CRON_SECRET;
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
      dueDate: { gte: now, lte: in48h },
    },
    include: { 
      assignee: { select: { email: true, name: true, id: true } },
      assigner: { select: { email: true, name: true, id: true } }
    },
  });

  let sent = 0;
  for (const t of tasks) {
    const hoursUntilDue = Math.round((t.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    const sendToAssignee = t.assignee?.email && t.assignee?.id !== t.assigner?.id;
    const sendToAssigner = t.assigner?.email && t.assigner?.email !== t.assignee?.email;

    if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
      const recipients = [];
      if (sendToAssignee) recipients.push(t.assignee);
      if (sendToAssigner) recipients.push(t.assigner);
      if (recipients.length > 0) {
        await sendReminder(t, '24h', recipients);
        await prisma.task.update({ where: { id: t.id }, data: { lastReminderAt: new Date() } });
        sent++;
      }
    } else if (hoursUntilDue <= 48 && hoursUntilDue > 24) {
      const recipients = [];
      if (sendToAssignee) recipients.push(t.assignee);
      if (sendToAssigner) recipients.push(t.assigner);
      if (recipients.length > 0) {
        await sendReminder(t, '48h', recipients);
        await prisma.task.update({ where: { id: t.id }, data: { lastReminderAt: new Date() } });
        sent++;
      }
    }
  }
  return NextResponse.json({sent});
}
