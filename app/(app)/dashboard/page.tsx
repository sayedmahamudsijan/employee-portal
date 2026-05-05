import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar } from "@/components/shared/avatar";
import { Progress } from "@/components/ui/progress";
import { formatDate, getCurrentQuarter, timeAgo } from "@/lib/utils";
import {
  CheckSquare,
  CalendarOff,
  Target,
  Clock,
  Megaphone,
  Sparkles,
  CalendarDays,
  ListChecks,
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
  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);

  // Wrap each new query so missing tables don't break dashboard
  const safe = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await p;
    } catch {
      return fallback;
    }
  };

  const [
    todayTasks,
    leaveBalance,
    announcements,
    goals,
    hasWorkLogToday,
    recentKudos,
    upcomingHolidays,
    onboarding,
  ] = await Promise.all([
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
    safe(
      prisma.kudos.findMany({
        where: { OR: [{ toId: userId }, { fromId: userId }], isPublic: true },
        include: {
          from: { select: { name: true, image: true } },
          to: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      [] as any[]
    ),
    safe(
      prisma.publicHoliday.findMany({
        where: { date: { gte: today, lte: next30Days } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      [] as any[]
    ),
    safe(
      prisma.onboardingChecklist.findUnique({ where: { userId } }),
      null as any
    ),
  ]);

  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = session.user.name?.split(" ")[0] ?? "there";

  // Onboarding progress
  const onboardingItems = (onboarding?.items as any[]) ?? [];
  const onboardingDone = onboardingItems.filter((i) => i.done).length;
  const onboardingTotal = onboardingItems.length;
  const showOnboarding = onboarding && onboardingTotal > 0 && !onboarding.completedAt;

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

      {/* Onboarding banner */}
      {showOnboarding && (
        <Link
          href="/onboarding"
          className="block rounded-xl border border-primary/40 bg-primary/5 p-4 hover:bg-primary/10 transition"
        >
          <div className="flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Onboarding in progress</p>
              <p className="text-xs text-muted-foreground">
                {onboardingDone} of {onboardingTotal} steps complete · Tap to continue
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-primary">
              {Math.round((onboardingDone / onboardingTotal) * 100)}%
            </div>
          </div>
        </Link>
      )}

      {/* Leave balance */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Leave Balance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Casual" value={leaveBalance?.casual ?? 12} icon={CalendarOff} color="blue" />
          <StatCard label="Sick" value={leaveBalance?.sick ?? 10} icon={CalendarOff} color="amber" />
          <StatCard label="Annual" value={leaveBalance?.annual ?? 15} icon={CalendarOff} color="green" />
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
              <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <StatusBadge status={task.status} />
                <span className="flex-1 text-sm font-medium text-foreground truncate">{task.title}</span>
                {task.priority !== "MEDIUM" && (
                  <span className="text-xs text-muted-foreground">{task.priority}</span>
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
          <Link href="/work-log" className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0">
            Log now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Kudos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Kudos
            </h2>
            <Link href="/kudos" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentKudos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No kudos yet — give the first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentKudos.map((k: any) => (
                <div key={k.id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{k.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{k.from.name}</span>
                      {" → "}
                      <span className="font-medium text-foreground">{k.to.name}</span>
                    </p>
                    <p className="text-sm line-clamp-2">{k.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(k.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Holidays */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Upcoming Holidays
            </h2>
          </div>
          {upcomingHolidays.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No holidays in the next 30 days.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {upcomingHolidays.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{h.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(h.date)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              My Goals — {getCurrentQuarter()} {today.getFullYear()}
            </h2>
            <Link href="/goals" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{goal.progress}%</span>
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
          <Link href="/announcements" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Megaphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                  <h3 className="text-sm font-medium text-foreground">{a.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
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
