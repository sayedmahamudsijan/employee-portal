"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format, formatDistanceToNow, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, RefreshCw, Search, Trash2, AlertTriangle,
  Plus, Pencil, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw,
  ShieldCheck, UserCheck, UserX, Filter, X, Calendar, Hash,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

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
  user: { id: string; name: string; image: string | null; role: string };
};

export type EntityTab = { label: string; entity: string | null };

// ── Action styling ─────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  Created:          { color: "bg-green-500/15 text-green-500 border-green-500/30",    icon: Plus },
  Updated:          { color: "bg-blue-500/15 text-blue-500 border-blue-500/30",       icon: Pencil },
  Deleted:          { color: "bg-red-500/15 text-red-500 border-red-500/30",          icon: Trash2 },
  Approved:         { color: "bg-green-500/15 text-green-500 border-green-500/30",    icon: CheckCircle2 },
  Rejected:         { color: "bg-red-500/15 text-red-500 border-red-500/30",          icon: XCircle },
  Submitted:        { color: "bg-purple-500/15 text-purple-500 border-purple-500/30", icon: ArrowRight },
  Cancelled:        { color: "bg-orange-500/15 text-orange-500 border-orange-500/30", icon: RotateCcw },
  Completed:        { color: "bg-teal-500/15 text-teal-500 border-teal-500/30",       icon: CheckCircle2 },
  Activated:        { color: "bg-green-500/15 text-green-500 border-green-500/30",    icon: UserCheck },
  Deactivated:      { color: "bg-red-500/15 text-red-500 border-red-500/30",          icon: UserX },
  "Clocked In":     { color: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",       icon: Clock },
  "Clocked Out":    { color: "bg-slate-500/15 text-slate-400 border-slate-500/30",    icon: Clock },
  Assigned:         { color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", icon: CheckCircle2 },
  Pinned:           { color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", icon: ShieldCheck },
  Unpinned:         { color: "bg-gray-500/15 text-gray-400 border-gray-500/30",       icon: ShieldCheck },
  "Granted Access": { color: "bg-green-500/15 text-green-500 border-green-500/30",    icon: ShieldCheck },
  "Revoked Access": { color: "bg-red-500/15 text-red-500 border-red-500/30",          icon: ShieldCheck },
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

// ── Erase presets ──────────────────────────────────────────────────────────

const ERASE_PRESETS = [
  { label: "Older than 7 days",   fn: () => subDays(new Date(), 7) },
  { label: "Older than 30 days",  fn: () => subDays(new Date(), 30) },
  { label: "Older than 3 months", fn: () => subMonths(new Date(), 3) },
  { label: "Older than 6 months", fn: () => subMonths(new Date(), 6) },
  { label: "Older than 1 year",   fn: () => subYears(new Date(), 1) },
  { label: "Custom…",             fn: () => null },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { color: "bg-muted text-muted-foreground border-border", icon: Pencil };
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("flex items-center gap-1 text-xs font-semibold border px-1.5 py-0.5", cfg.color)}>
      <Icon className="w-3 h-3" />
      {action}
    </Badge>
  );
}

function DiffView({ oldValue, newValue }: { oldValue: Record<string, unknown> | null; newValue: Record<string, unknown> | null }) {
  if (!oldValue && !newValue) return null;
  const allKeys = Array.from(new Set([...Object.keys(oldValue ?? {}), ...Object.keys(newValue ?? {})]));
  if (allKeys.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 overflow-hidden text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium w-28">Field</th>
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium w-[45%]">Before</th>
            <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const prev = oldValue?.[key];
            const next = newValue?.[key];
            const changed = JSON.stringify(prev) !== JSON.stringify(next);
            const fmt = (v: unknown) =>
              v === undefined ? <span className="italic text-muted-foreground/40">—</span>
              : Array.isArray(v) ? (v as string[]).join(", ")
              : String(v);
            return (
              <tr key={key} className={cn("border-b border-border last:border-0", changed && "bg-yellow-500/5")}>
                <td className="px-3 py-1.5 text-muted-foreground font-mono">{key}</td>
                <td className="px-3 py-1.5 text-red-400/80 font-mono break-all">{fmt(prev)}</td>
                <td className="px-3 py-1.5 text-green-500/80 font-mono break-all">{fmt(next)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDialog({
  open, title, message, confirmLabel, danger, onConfirm, onCancel, children,
}: {
  open: boolean; title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className={cn("w-5 h-5 mt-0.5 flex-shrink-0", danger ? "text-red-500" : "text-yellow-500")} />
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            className={danger ? "bg-red-600 hover:bg-red-700 text-white border-0" : ""}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LogCard({
  entry, isExecutive, onDelete,
}: {
  entry: LogEntry; isExecutive: boolean; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasDiff = entry.oldValue || entry.newValue;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors group">
        <div className="flex items-start gap-3">
          <Avatar name={entry.user.name} src={entry.user.image} size="sm" className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{entry.user.name}</span>
              <ActionBadge action={entry.action} />
              {entry.entity && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{entry.entity}</span>
              )}
              {entry.entityId && (
                <span className="text-xs text-muted-foreground/50 font-mono hidden sm:inline" title={`Change ID: ${entry.entityId}`}>
                  #{entry.entityId.slice(-8)}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0" title={format(new Date(entry.createdAt), "PPpp")}>
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
              </span>
              {isExecutive && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-red-500"
                  title="Delete this entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
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

      <ConfirmDialog
        open={confirmDelete}
        title="Delete history entry"
        message="This action permanently removes this log entry and cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(entry.id); }}
      />
    </>
  );
}

// ── ErasePanel ─────────────────────────────────────────────────────────────

function ErasePanel({ section, isExecutive, onErased }: { section: string; isExecutive: boolean; onErased: () => void }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [erasing, setErasing] = useState(false);

  if (!isExecutive) return null;

  const getCutoff = (): Date | null => {
    if (preset === null) return null;
    if (preset < ERASE_PRESETS.length - 1) return ERASE_PRESETS[preset].fn();
    const days = parseInt(customDays);
    if (!days || days <= 0) return null;
    return subDays(new Date(), days);
  };

  const cutoff = getCutoff();

  const doErase = async () => {
    if (!cutoff) return;
    setErasing(true);
    try {
      const res = await fetch("/api/history/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThan: cutoff.toISOString(), section: section !== "all" ? section : undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onErased();
      setOpen(false);
      setPreset(null);
      setConfirm(false);
    } catch (e: any) {
      alert(e.message ?? "Failed to erase history");
    } finally {
      setErasing(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Erase History
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" /> Erase History
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete log entries older than a selected date. This cannot be undone.
            </p>

            <div className="grid grid-cols-1 gap-2 mb-4">
              {ERASE_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPreset(i)}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                    preset === i
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border hover:border-border/80 hover:bg-muted/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === ERASE_PRESETS.length - 1 && (
              <div className="flex items-center gap-2 mb-4">
                <Input
                  type="number"
                  placeholder="Number of days"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-36"
                  min={1}
                />
                <span className="text-sm text-muted-foreground">days ago</span>
              </div>
            )}

            {cutoff && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2 mb-4">
                Will delete all entries before <span className="font-semibold text-foreground">{format(cutoff, "PPP")}</span>
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!cutoff}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={() => setConfirm(true)}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm}
        title="Confirm erase"
        message={`This will permanently delete all history entries before ${cutoff ? format(cutoff, "PPP") : ""}. Are you sure?`}
        confirmLabel={erasing ? "Erasing…" : "Erase permanently"}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={doErase}
      />
    </>
  );
}

// ── FilterBar ──────────────────────────────────────────────────────────────

function FilterBar({
  actors, selectedActor, onActorChange,
  selectedAction, onActionChange,
  entityId, onEntityIdChange,
  onClear, hasFilters,
}: {
  actors: { id: string; name: string }[];
  selectedActor: string; onActorChange: (v: string) => void;
  selectedAction: string; onActionChange: (v: string) => void;
  entityId: string; onEntityIdChange: (v: string) => void;
  onClear: () => void; hasFilters: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border mb-4">
      <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

      {/* Actor filter */}
      <select
        value={selectedActor}
        onChange={(e) => onActorChange(e.target.value)}
        className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="">All users</option>
        {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      {/* Action type filter */}
      <select
        value={selectedAction}
        onChange={(e) => onActionChange(e.target.value)}
        className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="">All actions</option>
        {ALL_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      {/* Change ID (entityId) */}
      <div className="flex items-center gap-1">
        <Hash className="w-3 h-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Change ID…"
          value={entityId}
          onChange={(e) => onEntityIdChange(e.target.value)}
          className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/50 w-32 font-mono"
        />
      </div>

      {hasFilters && (
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}

// ── Main HistoryFeed component ─────────────────────────────────────────────

interface Props {
  section: string;
  title: string;
  description: string;
  entityTabs?: EntityTab[];   // section-specific entity sub-tabs
  isExecutive?: boolean;      // whether the current user can delete/erase
}

export function HistoryFeed({ section, title, description, entityTabs = [], isExecutive = false }: Props) {
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);

  // Filters
  const [search, setSearch]           = useState("");
  const [activeEntity, setActiveEntity] = useState<string | null>(null); // entity tab
  const [actorId, setActorId]         = useState("");
  const [actionType, setActionType]   = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Actors derived from logs (for dropdown)
  const [actors, setActors] = useState<{ id: string; name: string }[]>([]);

  const buildUrl = useCallback((p = 1) => {
    const params = new URLSearchParams({ section, page: String(p), limit: "50" });
    if (activeEntity)    params.set("entity", activeEntity);
    if (actorId)         params.set("actorId", actorId);
    if (actionType)      params.set("action", actionType);
    if (entityIdFilter)  params.set("entityId", entityIdFilter);
    return `/api/history?${params}`;
  }, [section, activeEntity, actorId, actionType, entityIdFilter]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(p));
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
        setTotalPages(data.meta?.pages ?? 1);
        setTotal(data.meta?.total ?? 0);
        setPage(p);
        // Derive unique actors
        const seen = new Set<string>();
        const acts: { id: string; name: string }[] = [];
        for (const l of data.data as LogEntry[]) {
          if (!seen.has(l.user.id)) { seen.add(l.user.id); acts.push({ id: l.user.id, name: l.user.name }); }
        }
        setActors((prev) => {
          const combined = [...prev, ...acts];
          const deduped = Array.from(new Map(combined.map((a) => [a.id, a])).values());
          return deduped;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Reload when filters or entity tab change
  useEffect(() => { load(1); }, [load]);

  // Client-side text search on top of server-side filters
  const displayed = search.trim()
    ? logs.filter((l) => {
        const q = search.toLowerCase();
        return (
          l.user.name.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity?.toLowerCase().includes(q) ||
          l.entityId?.toLowerCase().includes(q)
        );
      })
    : logs;

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const hasServerFilters = !!(actorId || actionType || entityIdFilter);
  const clearFilters = () => { setActorId(""); setActionType(""); setEntityIdFilter(""); };

  // All entity tabs: [All, ...section-specific]
  const tabs: EntityTab[] = [{ label: "All", entity: null }, ...entityTabs];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {!loading && <p className="text-xs text-muted-foreground mt-0.5">{total} total events</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ErasePanel section={section} isExecutive={isExecutive} onErased={() => load(1)} />
          <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Entity tabs (subsection filter) */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.entity ?? "all"}
              onClick={() => setActiveEntity(tab.entity)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border",
                activeEntity === tab.entity
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, details, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((f) => !f)}
          className={cn(hasServerFilters && "border-primary/40 text-primary")}
        >
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          Filters {hasServerFilters && `(${[actorId, actionType, entityIdFilter].filter(Boolean).length})`}
        </Button>
      </div>

      {/* Advanced filter bar */}
      {showFilters && (
        <FilterBar
          actors={actors}
          selectedActor={actorId}
          onActorChange={setActorId}
          selectedAction={actionType}
          onActionChange={setActionType}
          entityId={entityIdFilter}
          onEntityIdChange={setEntityIdFilter}
          onClear={clearFilters}
          hasFilters={hasServerFilters}
        />
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No history yet</p>
          <p className="text-sm mt-1">Activity in this section will appear here.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {displayed.map((entry) => (
              <LogCard key={entry.id} entry={entry} isExecutive={isExecutive} onDelete={handleDelete} />
            ))}
          </div>

          {!search && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => load(page - 1)} disabled={page <= 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => load(page + 1)} disabled={page >= totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
