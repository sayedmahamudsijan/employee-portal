import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { Progress } from "@/components/ui/progress";
import { formatDate, getCurrentQuarter } from "@/lib/utils";
import {
  CheckSquare,
  CalendarOff,
  Target,
  Clock,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTasks, leaveBalance, announcements, goals, hasWorkLogToday] =
    await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId, dueDate: { gte: today, lt: tomorrow } },
        include: { assignee: true },
        take: 5,
      }),
      prisma.leaveBalance.findUnique({ where: { userId } }),
      prisma.announcement.findMany({
        where: { OR: [{ pinned: true }, {}] },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { author: true },
        take: 3,
      }),
      prisma.goal.findMany({
        where: {
          userId,
          quarter: getCurrentQuarter(),
          year: today.getFullYear(),
          status: "IN_PROGRESS",
        },
        take: 4,
      }),
      prisma.workLog.findFirst({
        where: { userId, date: { gte: today, lt: tomorrow } },
      }),
    ]);

  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Leave balance */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Leave Balance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Casual"
            value={leaveBalance?.casual ?? 12}
            icon={CalendarOff}
            color="blue"
          />
          <StatCard
            label="Sick"
            value={leaveBalance?.sick ?? 10}
            icon={CalendarOff}
            color="amber"
          />
          <StatCard
            label="Annual"
            value={leaveBalance?.annual ?? 15}
            icon={CalendarOff}
            color="green"
          />
        </div>
      </section>

      {/* Today's tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Tasks Due Today
          </h2>
          <Link href="/tasks" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <CheckSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No tasks due today. Enjoy the breathing room!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <StatusBadge status={task.status} />
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {task.title}
                </span>
                {task.priority !== "MEDIUM" && (
                  <span className="text-xs text-muted-foreground">
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Work log prompt */}
      {!hasWorkLogToday && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              You haven&apos;t logged your work for today yet.
            </p>
          </div>
          <Link
            href="/work-log"
            className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
          >
            Log now →
          </Link>
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              My Goals — {getCurrentQuarter()} {today.getFullYear()}
            </h2>
            <Link href="/goals" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {goal.title}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {goal.progress}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Announcements
          </h2>
          <Link
            href="/announcements"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Megaphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                  <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {a.body}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar name={a.author.name} src={a.author.image} size="xs" />
                  <span className="text-xs text-muted-foreground">
                    {a.author.name} · {formatDate(a.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
