import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tasks/reminders -> check and send reminders for upcoming hearings
// This can be called via a cron job (e.g., Vercel Cron)
export async function GET(req: NextRequest) {
  // Verify cron secret if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();

  // Find tasks with reminder dates that have passed but haven't been sent
  const tasks = await prisma.task.findMany({
    where: {
      reminderDate: { lte: now },
      reminderSent: false,
      nextHearingDate: { not: null },
    },
  });

  let sentCount = 0;

  for (const task of tasks) {
    const assigneeIds = task.assigneeIds.split(',').map(Number).filter(Boolean);
    
    for (const assigneeId of assigneeIds) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'HEARING_REMINDER',
          message: `Reminder: Next hearing for "${task.title}" on ${task.nextHearingDate?.toLocaleDateString()}${task.nextHearingRemarks ? ` - ${task.nextHearingRemarks}` : ''}`,
        },
      });

      // Send email
      const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { email: true, name: true } });
      if (user?.email) {
        try {
          await import('@/lib/email').then(m =>
            m.sendMail(
              user.email,
              `Hearing Reminder: ${task.title}`,
              `<div style="font-family: Arial, sans-serif;">
                <h2>Hearing Reminder</h2>
                <p>Dear ${user.name || 'Colleague'},</p>
                <p>This is a reminder about an upcoming hearing:</p>
                <table style="border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 8px; font-weight: bold;">Case:</td><td style="padding: 8px;">${task.title}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Case Number:</td><td style="padding: 8px;">${task.caseNumber || '-'}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Next Hearing:</td><td style="padding: 8px;">${task.nextHearingDate?.toLocaleDateString()}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Court:</td><td style="padding: 8px;">${task.courtAuthority || '-'}</td></tr>
                  ${task.nextHearingRemarks ? `<tr><td style="padding: 8px; font-weight: bold;">Remarks:</td><td style="padding: 8px;">${task.nextHearingRemarks}</td></tr>` : ''}
                </table>
                <p>Please prepare accordingly.</p>
              </div>`
            )
          );
        } catch {}
      }
    }

    // Mark reminder as sent
    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSent: true },
    });

    sentCount++;
  }

  return NextResponse.json({ ok: true, reminders_sent: sentCount });
}
