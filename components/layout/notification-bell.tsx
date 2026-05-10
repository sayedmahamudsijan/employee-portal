"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, MessageSquare, Megaphone, Star,
  CalendarOff, CheckSquare, AlertCircle, Wallet, Clock,
  Users, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, timeAgo } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

// ── Icon + colour map per notification type ────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  TASK_ASSIGNED:    { icon: CheckSquare,    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  TASK_OVERDUE:     { icon: AlertCircle,    color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  TASK_BLOCKED:     { icon: AlertCircle,    color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  LEAVE_REQUEST:    { icon: CalendarOff,    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  LEAVE_APPROVED:   { icon: CalendarOff,    color: "bg-green-500/15 text-green-600 dark:text-green-400" },
  LEAVE_REJECTED:   { icon: CalendarOff,    color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  LEAVE_UPDATE:     { icon: CalendarOff,    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  ANNOUNCEMENT:     { icon: Megaphone,      color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  REVIEW_SUBMITTED: { icon: Star,           color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  WORK_LOG_REMINDER:{ icon: Clock,          color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  WORK_LOG:         { icon: ClipboardList,  color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  kudos:            { icon: Star,           color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  expense:          { icon: Wallet,         color: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  "1on1":           { icon: Users,          color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  TEAM_MESSAGE:     { icon: MessageSquare,  color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: Bell, color: "bg-muted text-muted-foreground" };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Poll unread count every 30 s ──────────────────────────────────────────
  const refreshCount = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications/unread-count");
      const d = await r.json();
      setUnread(d.data ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 30_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // ── Load unread-only list when dropdown opens ─────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications?unread=true")
      .then((r) => r.json())
      .then((d) => setNotifs(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function markOneRead(id: string, link: string | null) {
    // Optimistic: remove from dropdown immediately (it's now read)
    setNotifs((ns) => ns.filter((n) => n.id !== id));
    setUnread((prev) => Math.max(0, prev - 1));

    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});

    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  async function markAllRead() {
    // Clear the dropdown entirely — all are now read
    setNotifs([]);
    setUnread(0);
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative inline-flex items-center justify-center rounded-md w-9 h-9 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {/* Red dot — bottom-right corner of the bell */}
        {unread > 0 && (
          <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-[1.5px] ring-background" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 overflow-hidden shadow-xl"
        sideOffset={6}
      >
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <span className="text-[11px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 leading-none tabular-nums">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 transition-colors font-medium"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* ── Notification list ───────────────────────────────────────────── */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs opacity-60 mt-0.5">No new notifications</p>
              </div>
            </div>
          ) : (
            notifs.map((n) => {
              const { icon: Icon, color } = getTypeMeta(n.type);
              return (
                <button
                  key={n.id}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors",
                    !n.read && "bg-primary/5 dark:bg-primary/10"
                  )}
                  onClick={() => markOneRead(n.id, n.link)}
                >
                  {/* Icon bubble */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    color
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs leading-snug break-words",
                      !n.read ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Footer link ─────────────────────────────────────────────────── */}
        <div className="border-t border-border p-2 bg-muted/20">
          <Link
            href="/notifications"
            className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/60 font-medium"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
