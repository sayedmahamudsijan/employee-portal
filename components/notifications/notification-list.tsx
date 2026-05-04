"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Bell, CheckSquare, CalendarOff, Megaphone,
  Star, AlertCircle, CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  TASK_ASSIGNED: CheckSquare,
  TASK_OVERDUE: AlertCircle,
  TASK_BLOCKED: AlertCircle,
  LEAVE_REQUEST: CalendarOff,
  LEAVE_APPROVED: CalendarOff,
  LEAVE_REJECTED: CalendarOff,
  ANNOUNCEMENT: Megaphone,
  REVIEW_SUBMITTED: Star,
  WORK_LOG_REMINDER: Bell,
};

export function NotificationList({ notifications: initial, userId }: { notifications: Notification[]; userId: string }) {
  const [notifications, setNotifications] = useState(initial);
  const [marking, setMarking] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications");
    } finally {
      setMarking(false);
    }
  }

  async function markRead(id: string) {
    setNotifications((ns) =>
      ns.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />;
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={markAllRead} disabled={marking}>
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          const Wrapper = n.link ? Link : "div";
          return (
            <Wrapper
              key={n.id}
              href={n.link ?? "#"}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/30",
                !n.read && "bg-primary/5 dark:bg-primary/10"
              )}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                !n.read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm leading-snug", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
