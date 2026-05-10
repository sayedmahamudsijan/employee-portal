"use client";

import { useEffect, useState, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, RefreshCw, Search, User2,
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock,
  ArrowRight, RotateCcw, ShieldCheck, UserCheck, UserX,
} from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  section: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
};

const ACTION_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  Created:        { color: "bg-green-500/15 text-green-600 border-green-500/30",   icon: Plus },
  Updated:        { color: "bg-blue-500/15 text-blue-600 border-blue-500/30",      icon: Pencil },
  Deleted:        { color: "bg-red-500/15 text-red-600 border-red-500/30",         icon: Trash2 },
  Approved:       { color: "bg-green-500/15 text-green-600 border-green-500/30",   icon: CheckCircle2 },
  Rejected:       { color: "bg-red-500/15 text-red-600 border-red-500/30",         icon: XCircle },
  Submitted:      { color: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: ArrowRight },
  Cancelled:      { color: "bg-orange-500/15 text-orange-600 border-orange-500/30", icon: RotateCcw },
  Completed:      { color: "bg-teal-500/15 text-teal-600 border-teal-500/30",      icon: CheckCircle2 },
  Activated:      { color: "bg-green-500/15 text-green-600 border-green-500/30",   icon: UserCheck },
  Deactivated:    { color: "bg-red-500/15 text-red-600 border-red-500/30",         icon: UserX },
  "Clocked In":   { color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",      icon: Clock },
  "Clocked Out":  { color: "bg-slate-500/15 text-slate-600 border-slate-500/30",   icon: Clock },
  Assigned:       { color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30", icon: User2 },
  Pinned:         { color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: ShieldCheck },
  Unpinned:       { color: "bg-gray-500/15 text-gray-600 border-gray-500/30",       icon: ShieldCheck },
  "Granted Access": { color: "bg-green-500/15 text-green-600 border-green-500/30", icon: ShieldCheck },
  "Revoked Access": { color: "bg-red-500/15 text-red-600 border-red-500/30",       icon: ShieldCheck },
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { color: "bg-muted text-muted-foreground border-border", icon: Pencil };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 text-xs font-semibold border", cfg.color)}>
      <Icon className="w-3 h-3" />
      {action}
    </Badge>
  );
}

function DiffView({ oldValue, newValue }: { oldValue: Record<string, unknown> | null; newValue: Record<string, unknown> | null }) {
  if (!oldValue && !newValue) return null;

  const allKeys = Array.from(new Set([
    ...Object.keys(oldValue ?? {}),
    ...Object.keys(newValue ?? {}),
  ]));

  if (allKeys.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 overflow-hidden text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium w-24">Field</th>
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium w-1/2">Before</th>
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const prev = oldValue?.[key];
            const next = newValue?.[key];
            const changed = JSON.stringify(prev) !== JSON.stringify(next);
            return (
              <tr key={key} className={cn("border-b border-border last:border-0", changed && "bg-yellow-500/5")}>
                <td className="px-3 py-1.5 text-muted-foreground font-mono">{key}</td>
                <td className="px-3 py-1.5 text-red-400/80 font-mono break-all">
                  {prev !== undefined ? String(Array.isArray(prev) ? (prev as string[]).join(", ") : prev) : <span className="text-muted-foreground/40 italic">—</span>}
                </td>
                <td className="px-3 py-1.5 text-green-500/80 font-mono break-all">
                  {next !== undefined ? String(Array.isArray(next) ? (next as string[]).join(", ") : next) : <span className="text-muted-foreground/40 italic">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LogCard({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = entry.oldValue || entry.newValue;

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
          <AvatarImage src={entry.user.image ?? ""} alt={entry.user.name} />
          <AvatarFallback className="text-xs">{entry.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{entry.user.name}</span>
            <ActionBadge action={entry.action} />
            {entry.entity && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                {entry.entity}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0" title={format(new Date(entry.createdAt), "PPpp")}>
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </span>
          </div>
          {entry.details && (
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.details}</p>
          )}
          {hasDiff && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide" : "Show"} changes
            </button>
          )}
          {expanded && <DiffView oldValue={entry.oldValue} newValue={entry.newValue} />}
        </div>
      </div>
    </div>
  );
}

interface Props {
  section: string;
  title: string;
  description: string;
}

export function HistoryFeed({ section, title, description }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<LogEntry[]>([]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?section=${section}&page=${p}&limit=50`);
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
        setTotalPages(data.meta?.pages ?? 1);
        setTotal(data.meta?.total ?? 0);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(logs); return; }
    const q = search.toLowerCase();
    setFiltered(logs.filter((l) =>
      l.user.name.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity?.toLowerCase().includes(q)
    ));
  }, [search, logs]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {!loading && <p className="text-xs text-muted-foreground mt-0.5">{total} total events</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => load(1)} disabled={loading} className="flex-shrink-0">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filter by user, action, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No history yet</p>
          <p className="text-sm mt-1">Activity in this section will appear here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {filtered.map((entry) => (
              <LogCard key={entry.id} entry={entry} />
            ))}
          </div>

          {!search && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => load(page - 1)} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => load(page + 1)} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
