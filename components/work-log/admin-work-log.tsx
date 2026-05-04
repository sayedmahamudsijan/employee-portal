"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { DEPARTMENTS } from "@/lib/roles";
import { format } from "date-fns";
import { Download, RefreshCw } from "lucide-react";

type WorkLog = {
  id: string;
  date: string;
  hours: number;
  description: string;
  user: { id: string; name: string; employeeId: string | null; department: string | null };
  task: { id: string; title: string } | null;
};

type Employee = { id: string; name: string; department: string | null };

const PERIODS = [
  { value: "all",   label: "All Time" },
  { value: "day",   label: "Today" },
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year",  label: "This Year" },
];

export function AdminWorkLog({ employees }: { employees: Employee[] }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("month");
  const [userId, setUserId] = useState("all");
  const [department, setDepartment] = useState("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (period !== "all") params.set("period", period);
    if (userId !== "all") params.set("userId", userId);
    if (department !== "all") params.set("department", department);

    try {
      const res = await fetch(`/api/worklogs?${params}`);
      const json = await res.json();
      setLogs(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [period, userId, department]);

  useEffect(() => { fetch_(); }, [fetch_]);

  function exportCSV() {
    const header = ["Date", "Employee", "Employee ID", "Department", "Task", "Hours", "Description"];
    const rows = logs.map((l) => [
      format(new Date(l.date), "yyyy-MM-dd"),
      l.user.name,
      l.user.employeeId ?? "",
      l.user.department ?? "",
      l.task?.title ?? "",
      l.hours,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-logs-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
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

        <Select value={department} onValueChange={(v) => { setDepartment(v); setUserId("all"); }}>
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
            <span className="font-semibold text-foreground">{logs.length}</span> entries · <span className="font-semibold text-foreground">{totalHours.toFixed(1)}</span> hrs total
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
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
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                    {log.task?.title ?? <span className="italic">No task</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground text-sm">
                    {log.hours}h
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Total</td>
                <td className="px-4 py-3 text-right font-bold text-foreground">{totalHours.toFixed(1)}h</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
