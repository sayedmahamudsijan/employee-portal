import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { WorkLogClient } from "@/components/work-log/work-log-client";

export default async function WorkLogPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const now   = new Date();
  const start = startOfMonth(now);
  const end   = endOfMonth(now);

  const [workLogs, tasks] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      include: {
        task:       { select: { id: true, title: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.task.findMany({
      where:   { assigneeId: session.user.id, status: { not: "DONE" } },
      select:  { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <WorkLogClient
      initialLogs={JSON.parse(JSON.stringify(workLogs))}
      tasks={tasks}
      userId={session.user.id}
    />
  );
}
