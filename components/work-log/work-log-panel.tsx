"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Send, RotateCcw, AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkLogStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type WorkLog = {
  id: string;
  date: string;
  hours: number;
  description: string;
  taskId: string | null;
  task: { id: string; title: string } | null;
  status: WorkLogStatus;
  rejectionReason?: string | null;
  approvedBy?: { id: string; name: string } | null;
  approvedAt?: string | null;
};

type Task = { id: string; title: string };

interface Props {
  date: Date;
  logs: WorkLog[];
  tasks: Task[];
  userId: string;
  onLogAdded:   (log: WorkLog) => void;
  onLogDeleted: (id: string) => void;
  onLogUpdated: (log: WorkLog) => void;
}

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WorkLogStatus, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border border-border",
    icon: <Pencil className="w-2.5 h-2.5" />,
  },
  SUBMITTED: {
    label: "Pending Review",
    className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    icon: <Clock className="w-2.5 h-2.5" />,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    icon: <CheckCircle2 className="w-2.5 h-2.5" />,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: <AlertCircle className="w-2.5 h-2.5" />,
  },
};

function StatusBadge({ status }: { status: WorkLogStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkLogPanel({ date, logs, tasks, userId, onLogAdded, onLogDeleted, onLogUpdated }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ taskId: "", hours: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

  // ── Add log ──────────────────────────────────────────────────────────────

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hours || !form.description) return toast.error("Hours and description are required");
    setSaving(true);
    try {
      const res = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskId: form.taskId && form.taskId !== "none" ? form.taskId : undefined,
          date: date.toISOString(),
          hours: parseFloat(form.hours),
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onLogAdded(data);
      setForm({ taskId: "", hours: "", description: "" });
      setAdding(false);
      toast.success("Work logged");
    } catch {
      toast.error("Failed to log work");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete log ────────────────────────────────────────────────────────────

  async function deleteLog(log: WorkLog) {
    if (log.status !== "DRAFT") {
      toast.error("Only Draft logs can be deleted. Retract the submission first.");
      return;
    }
    setActioning(log.id);
    try {
      const res = await fetch(`/api/worklogs/${log.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      onLogDeleted(log.id);
      toast.success("Log removed");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete log");
    } finally {
      setActioning(null);
    }
  }

  // ── Status actions ────────────────────────────────────────────────────────

  async function changeStatus(log: WorkLog, status: WorkLogStatus) {
    setActioning(log.id);
    try {
      const res = await fetch(`/api/worklogs/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      const { data } = await res.json();
      onLogUpdated(data);
      const messages: Record<string, string> = {
        SUBMITTED: "Submitted for review",
        DRAFT: "Retracted — back to draft",
      };
      toast.success(messages[status] ?? "Updated");
    } catch (e: any) {
      toast.error(e.message ?? "Action failed");
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{format(date, "EEEE, MMM d")}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            {totalHours}h total
          </div>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Existing logs */}
      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => {
            const isActioning = actioning === log.id;
            return (
              <div key={log.id} className="rounded-lg bg-muted/50 p-3 space-y-2">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{log.hours}h</span>
                    {log.task && (
                      <span className="text-xs text-primary truncate max-w-[120px]">{log.task.title}</span>
                    )}
                    <StatusBadge status={log.status} />
                  </div>
                  {/* Delete — only for DRAFT */}
                  {log.status === "DRAFT" && (
                    <button
                      disabled={isActioning}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                      onClick={() => deleteLog(log)}
                      aria-label="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{log.description}</p>

                {/* Rejection reason */}
                {log.status === "REJECTED" && log.rejectionReason && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5">
                    <p className="text-xs text-red-700 dark:text-red-400">
                      <span className="font-semibold">Rejected:</span> {log.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Approval info */}
                {log.status === "APPROVED" && log.approvedBy && (
                  <p className="text-[10px] text-green-600 dark:text-green-400">
                    Approved by {log.approvedBy.name}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-1.5 pt-0.5">
                  {/* DRAFT → Submit for review */}
                  {log.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      disabled={isActioning}
                      onClick={() => changeStatus(log, "SUBMITTED")}
                    >
                      <Send className="w-3 h-3" />
                      Submit for Review
                    </Button>
                  )}

                  {/* SUBMITTED → Retract */}
                  {log.status === "SUBMITTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      disabled={isActioning}
                      onClick={() => changeStatus(log, "DRAFT")}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retract
                    </Button>
                  )}

                  {/* REJECTED → Revise (back to DRAFT) */}
                  {log.status === "REJECTED" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 gradient-brand text-white border-0"
                      disabled={isActioning}
                      onClick={() => changeStatus(log, "DRAFT")}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revise & Resubmit
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {logs.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-4">No entries for this day.</p>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={addLog} className="space-y-2.5 border-t border-border pt-4">
          <Select value={form.taskId} onValueChange={(v) => setForm((f) => ({ ...f, taskId: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Link to task (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No task</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            placeholder="Hours *"
            value={form.hours}
            onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            className="h-8 text-sm"
            required
          />
          <Textarea
            placeholder="What did you work on? *"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="text-sm"
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Log Work"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
