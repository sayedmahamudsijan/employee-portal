import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { subDays, startOfMonth, format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  if (!canAccess(session.user.role, "MANAGER")) redirect("/dashboard");

  const now = new Date();

  const [sprints, users, leaveTrend] = await Promise.all([
    prisma.sprint.findMany({
      orderBy: { startDate: "desc" },
      take: 7,
      include: {
        tasks: {
          select: {
            status: true, assigneeId: true,
            estimatedHrs: true, loggedHrs: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, name: true,
        tasks: {
          where: { sprint: { status: "ACTIVE" } },
          select: { status: true, estimatedHrs: true, loggedHrs: true },
        },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { gte: subDays(now, 180) } },
      select: { type: true, startDate: true, days: true },
    }),
  ]);

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");

  const velocity = sprints
    .slice(0, 6)
    .reverse()
    .map((s) => ({
      name: s.name,
      completed: s.tasks.filter((t) => t.status === "DONE").length,
      total: s.tasks.length,
    }));

  const statusBreakdown = activeSprint
    ? ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"].map((s) => ({
        name: s.replace("_", " "),
        value: activeSprint.tasks.filter((t) => t.status === s).length,
      }))
    : [];

  const workload = users
    .map((u) => ({
      name: u.name.split(" ")[0],
      tasks: u.tasks.length,
      logged: u.tasks.reduce((sum, t) => sum + t.loggedHrs, 0),
      estimated: u.tasks.reduce((sum, t) => sum + (t.estimatedHrs ?? 0), 0),
    }))
    .filter((u) => u.tasks > 0)
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 10);

  const monthlyLeave = Array.from({ length: 6 }, (_, i) => {
    const d = subDays(now, (5 - i) * 30);
    const key = format(d, "MMM");
    const filtered = leaveTrend.filter((l) =>
      format(new Date(l.startDate), "MMM") === key
    );
    return {
      month: key,
      CASUAL: filtered.filter((l) => l.type === "CASUAL").reduce((s, l) => s + l.days, 0),
      SICK: filtered.filter((l) => l.type === "SICK").reduce((s, l) => s + l.days, 0),
      ANNUAL: filtered.filter((l) => l.type === "ANNUAL").reduce((s, l) => s + l.days, 0),
    };
  });

  const overdueTasks = await prisma.task.count({
    where: { dueDate: { lt: now }, status: { not: "DONE" } },
  });

  return (
    <div>
      <PageHeader title="Analytics" description="Sprint metrics, team workload, and leave trends" />
      <AnalyticsDashboard
        velocity={velocity}
        statusBreakdown={statusBreakdown}
        workload={workload}
        monthlyLeave={monthlyLeave}
        overdueTasks={overdueTasks}
        activeSprint={activeSprint ? { name: activeSprint.name } : null}
      />
    </div>
  );
}
