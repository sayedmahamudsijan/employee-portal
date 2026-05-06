"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { DEPARTMENTS } from "@/lib/roles";
import { format } from "date-fns";
import {
  Download, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertCircle, Pencil, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WorkLogStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

type WorkLog = {
  id: string;
  date: string;
  hours: number;
  description: string;
  status: WorkLogStatus;
  rejectionReason: string | null;
  approvedAt: string | null;
  user: { id: string; name: string; employeeId: string | null; department: string | null };
  task: { id: string; title: string } | null;
  approvedBy: { id: string; name: string } | null;
};

type Employee = { id: string; name: string; department: string | null };

const PERIODS = [
  { value: "all",   label: "All Time" },
  { value: "day",   label: "Today" },
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year",  label: "This Year" },
];

const STATUS_OPTIONS = [
  { value: "all",       label: "All Statuses" },
  { value: "DRAFT",     label: "Draft" },
  { value: "SUBMITTED", label: "Pending Review" },
  { value: "APPROVED",  label: "Approved" },
  { value: "REJECTED",  label: "Rejected" },
];

const STATUS_CONFIG: Record<WorkLogStatus, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT:     { label: "Draft",          className: "bg-muted text-muted-foreground border border-border",                                                                       icon: <Pencil className="w-3 h-3" /> },
  SUBMITTED: { label: "Pending Review", className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",       icon: <Clock className="w-3 h-3" /> },
  APPROVED:  { label: "Approved",       className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",       icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED:  { label: "Rejected",       className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",                   icon: <AlertCircle className="w-3 h-3" /> },
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

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  log,
  onConfirm,
  onCancel,
}: {
  log: WorkLog;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Reject Work Log</h3>
        <p className="text-sm text-muted-foreground">
          You are rejecting <span className="font-medium text-foreground">{log.user.name}</span>'s log for{" "}
          <span className="font-medium text-foreground">{format(new Date(log.date), "dd MMM yyyy")}</span> ({log.hours}h).
        </p>
        <Textarea
          placeholder="Reason for rejection (optional but recommended)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white border-0"
            onClick={() => onConfirm(reason)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminWorkLog({ employees }: { employees: Employee[] }) {
  const [logs, setLogs]         = useState<WorkLog[]>([]);
  const [loading, setLoading]   = useState(false);
  const [period, setPeriod]     = useState("month");
  const [userId, setUserId]     = useState("all");
  const [department, setDept]   = useState("all");
  const [statusFilter, setStatus] = useState("SUBMITTED"); // default to showing pending
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WorkLog | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (period !== "all")        params.set("period",     period);
    if (userId !== "all")        params.set("userId",     userId);
    if (department !== "all")    params.set("department", department);
    if (statusFilter !== "all")  params.set("status",     statusFilter);
    try {
      const res  = await fetch(`/api/worklogs?${params}`);
      const json = await res.json();
      setLogs(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [period, userId, department, statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  // ── Approve ───────────────────────────────────────────────────────────────

  async function approve(log: WorkLog) {
    setActioning(log.id);
    try {
      const res = await fetch(`/api/worklogs/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      toast.success(`Approved ${log.user.name}'s log`);
      setLogs((prev) => prev.map((l) => l.id === log.id ? { ...l, status: "APPROVED" } : l));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to approve");
    } finally {
      setActioning(null);
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────

  async function reject(log: WorkLog, reason: string) {
    setRejectTarget(null);
    setActioning(log.id);
    try {
      const res = await fetch(`/api/worklogs/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error);
      }
      toast.success(`Rejected ${log.user.name}'s log`);
      setLogs((prev) =>
        prev.map((l) => l.id === log.id ? { ...l, status: "REJECTED", rejectionReason: reason } : l)
      );
    } catch (e: any) {
      toast.error(e.message ?? "Failed to reject");
    } finally {
      setActioning(null);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportCSV() {
    const header = ["Date", "Employee", "Employee ID", "Department", "Task", "Hours", "Status", "Approved By", "Description"];
    const rows = logs.map((l) => [
      format(new Date(l.date), "yyyy-MM-dd"),
      l.user.name,
      l.user.employeeId ?? "",
      l.user.department ?? "",
      l.task?.title ?? "",
      l.hours,
      l.status,
      l.approvedBy?.name ?? "",
      `"${l.description.replace(/"/g, '""')}"`,
    ]);
    const csv  = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `work-logs-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalHours     = logs.reduce((s, l) => s + l.hours, 0);
  const pendingCount   = logs.filter((l) => l.status === "SUBMITTED").length;
  const approvedCount  = logs.filter((l) => l.status === "APPROVED").length;
  const rejectedCount  = logs.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-4">
      {rejectTarget && (
        <RejectDialog
          log={rejectTarget}
          onConfirm={(reason) => reject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Pending Review", count: pendingCount,  color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
          { label: "Approved",       count: approvedCount, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" },
          { label: "Rejected",       count: rejectedCount, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800" },
        ].map((s) => (
          <span key={s.label} className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", s.color)}>
            {s.label}: {s.count}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={department} onValueChange={(v) => { setDept(v); setUserId("all"); }}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees
              .filter((e) => department === "all" || e.department === department)
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={fetch_} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{logs.length}</span> entries ·{" "}
            <span className="font-semibold text-foreground">{totalHours.toFixed(1)}</span> hrs total
          </span>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No work logs found for the selected filters.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Hours</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const isActioning = actioning === log.id;
                return (
                  <tr key={log.id} className={cn("transition-colors", log.status === "SUBMITTED" ? "hover:bg-amber-50/50 dark:hover:bg-amber-900/5" : "hover:bg-muted/20")}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.user.name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground text-xs">{log.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {log.user.employeeId ?? "—"} · {log.user.department ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-muted-foreground truncate">{log.description}</p>
                      {log.task && (
                        <p className="text-[10px] text-primary mt-0.5 truncate">{log.task.title}</p>
                      )}
                      {log.status === "REJECTED" && log.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-0.5">↳ {log.rejectionReason}</p>
                      )}
                      {log.status === "APPROVED" && log.approvedBy && (
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                          ✓ by {log.approvedBy.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground text-sm">
                      {log.hours}h
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "SUBMITTED" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-green-500 hover:bg-green-600 text-white border-0"
                            disabled={isActioning}
                            onClick={() => approve(log)}
                            title="Approve"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={isActioning}
                            onClick={() => setRejectTarget(log)}
                            title="Reject"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground text-center block">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Total</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">{totalHours.toFixed(1)}h</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
