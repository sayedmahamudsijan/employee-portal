"use client";

import { useEffect, useMemo, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { Shield, AlertTriangle, AlertOctagon, Info, RefreshCw, Filter } from "lucide-react";

/**
 * Admin Security audit log — read-only viewer over SecurityEvent rows.
 *
 * Filters: event name, severity, free-text search across email/IP/userId.
 * Auto-refreshes every 30 seconds while the tab is visible.
 */

export interface SecurityEvent {
  id:        string;
  event:     string;
  userId:    string | null;
  email:     string | null;
  severity:  "info" | "warn" | "critical";
  ip:        string | null;
  userAgent: string | null;
  metadata:  Record<string, unknown> | null;
  createdAt: string;
}

const SEVERITY_STYLES = {
  info:     { cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Info },
  warn:     { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  critical: { cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertOctagon },
} as const;

export function SecurityFeed({ initial }: { initial: SecurityEvent[] }) {
  const [events,   setEvents]   = useState<SecurityEvent[]>(initial);
  const [loading,  setLoading]  = useState(false);
  const [severity, setSeverity] = useState<string>("all");
  const [search,   setSearch]   = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severity !== "all") params.set("severity", severity);
      params.set("limit", "200");
      const res  = await fetch(`/api/admin/security?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.data?.events) setEvents(data.data.events);
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch when severity changes
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [severity]);

  // Auto-refresh every 30s while tab is visible
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30_000);
    return () => clearInterval(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [autoRefresh, severity]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      e.event.toLowerCase().includes(q) ||
      (e.email   ?? "").toLowerCase().includes(q) ||
      (e.ip      ?? "").toLowerCase().includes(q) ||
      (e.userId  ?? "").toLowerCase().includes(q),
    );
  }, [events, search]);

  const stats = useMemo(() => {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    let info = 0, warn = 0, critical = 0;
    for (const e of events) {
      if (new Date(e.createdAt).getTime() < last24h) continue;
      if (e.severity === "critical") critical++;
      else if (e.severity === "warn") warn++;
      else info++;
    }
    return { info, warn, critical };
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Header / stat strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-card border rounded-lg">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security Audit Log
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 24h:{" "}
            <span className="text-red-600 font-medium">{stats.critical} critical</span>{" "}·{" "}
            <span className="text-amber-600 font-medium">{stats.warn} warnings</span>{" "}·{" "}
            <span className="text-slate-500">{stats.info} info</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email / IP / event…"
            className="h-8 rounded-md border bg-background px-2 text-xs w-56"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
          <button
            onClick={refresh}
            disabled={loading}
            className="h-8 px-2.5 rounded-md border text-xs hover:bg-accent flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Event list */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Severity</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">User / Email</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No events match your filter.</td></tr>
            )}
            {filtered.map((e) => {
              const sev  = SEVERITY_STYLES[e.severity] ?? SEVERITY_STYLES.info;
              const Icon = sev.icon;
              return (
                <tr key={e.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap" title={new Date(e.createdAt).toLocaleString()}>
                    {timeAgo(new Date(e.createdAt))}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${sev.cls}`}>
                      <Icon className="w-3 h-3" />
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">{e.event}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{e.email ?? <span className="text-muted-foreground">—</span>}</div>
                    {e.userId && <div className="text-[10px] text-muted-foreground font-mono">{e.userId.slice(0, 12)}…</div>}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{e.ip ?? "—"}</td>
                  <td className="px-3 py-2 max-w-md">
                    {e.metadata && Object.keys(e.metadata).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-muted-foreground hover:text-foreground">{formatMetaSummary(e.metadata)}</summary>
                        <pre className="mt-1 text-[10px] bg-muted/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(e.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMetaSummary(meta: Record<string, unknown>): string {
  const keys = Object.keys(meta);
  if (keys.length === 0) return "—";
  const reason = (meta as any).reason ?? (meta as any).route ?? (meta as any).trigger;
  if (typeof reason === "string") return reason;
  return `${keys.length} field${keys.length === 1 ? "" : "s"}`;
}
