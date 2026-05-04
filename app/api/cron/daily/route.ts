import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { apiResponse, apiError } from "@/lib/utils";
import { subHours } from "date-fns";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();
  const results: string[] = [];

  // 1. Mark overdue sprints as COMPLETED
  const overdueSprints = await prisma.sprint.updateMany({
    where: { endDate: { lt: now }, status: { in: ["PLANNED", "ACTIVE"] } },
    data: { status: "COMPLETED" },
  });
  results.push(`Sprints completed: ${overdueSprints.count}`);

  // 2. Notify assignees of overdue tasks (not notified in last 24h)
  const overdueTasks = await prisma.task.findMany({
    where: { dueDate: { lt: now }, status: { not: "DONE" } },
    select: { id: true, title: true, assigneeId: true },
  });

  const recentNotifs = await prisma.notification.findMany({
    where: {
      type: "TASK_OVERDUE",
      createdAt: { gte: subHours(now, 24) },
    },
    select: { link: true },
  });

  const notifiedLinks = new Set(recentNotifs.map((n) => n.link));
  const tasksToNotify = overdueTasks.filter(
    (t) => !notifiedLinks.has(`/tasks?task=${t.id}`)
  );

  for (const task of tasksToNotify) {
    await createNotification({
      userId: task.assigneeId,
      type: "TASK_OVERDUE",
      message: `Task "${task.title}" is overdue`,
      link: `/tasks?task=${task.id}`,
    });
  }
  results.push(`Overdue task notifications sent: ${tasksToNotify.length}`);

  // 3. Work log reminders — active users who haven't logged today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const activeUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const usersWithLogs = await prisma.workLog.findMany({
    where: { date: { gte: todayStart } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const loggedUserIds = new Set(usersWithLogs.map((l) => l.userId));
  const usersWithoutLogs = activeUsers.filter((u) => !loggedUserIds.has(u.id));

  for (const user of usersWithoutLogs) {
    await createNotification({
      userId: user.id,
      type: "WORK_LOG_REMINDER",
      message: "Don't forget to log your work for today",
      link: "/work-log",
    });
  }
  results.push(`Work log reminders sent: ${usersWithoutLogs.length}`);

  return apiResponse({ results, timestamp: now.toISOString() });
}
