"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { timeAgo } from "@/lib/utils";
import { Activity } from "lucide-react";

type Log = {
  id: string;
  action: string;
  entity: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  task?: { id: string; title: string } | null;
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  approve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  reject: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  assign: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  return: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function actionPill(action: string) {
  const cls = ACTION_COLORS[action.replace("bulk-", "")] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {action}
    </span>
  );
}

export function AdminActivityFeed({ initial }: { initial: Log[] }) {
  const [logs, setLogs] = useState<Log[]>(initial);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Live-poll every 30s while user is on this tab.
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/activity?limit=50", { cache: "no-store" });
        const json = await res.json();
        if (json.data) setLogs(json.data);
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.entity === filter);
  const entities = Array.from(new Set(logs.map((l) => l.entity).filter(Boolean))) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1 rounded-full border ${
            filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        {entities.map((e) => (
          <button
            key={e}
            onClick={() => setFilter(e)}
            className={`text-xs px-3 py-1 rounded-full border ${
              filter === e ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activity logged yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
              <Avatar name={log.user.name} src={log.user.image} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{log.user.name}</span>
                  {actionPill(log.action)}
                  {log.entity && <span className="text-xs text-muted-foreground">{log.entity}</span>}
                </div>
                {log.details && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(log.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Auto-refreshing every 30s · Showing latest {filtered.length}
      </p>
    </div>
  );
}
