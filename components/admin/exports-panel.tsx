"use client";

import { Button } from "@/components/ui/button";
import { Download, Users, Clock, CalendarOff, CheckSquare } from "lucide-react";
import { toast } from "sonner";

const EXPORTS = [
  { key: "users", label: "All Users", description: "Complete employee directory with roles, departments, manager", icon: Users },
  { key: "worklogs", label: "Work Logs", description: "All time entries by date and employee", icon: Clock },
  { key: "leave", label: "Leave Requests", description: "All leave requests with approval status", icon: CalendarOff },
  { key: "tasks", label: "Tasks", description: "All tasks with assignees, status, hours", icon: CheckSquare },
];

export function ExportsPanel() {
  async function download(key: string) {
    try {
      const res = await fetch(`/api/admin/export/${key}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${key} exported`);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Download CSVs for use in Excel, Google Sheets, or your reporting tool.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPORTS.map((e) => {
          const Icon = e.icon;
          return (
            <div key={e.key} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold">{e.label}</h4>
                <p className="text-xs text-muted-foreground mb-2">{e.description}</p>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => download(e.key)}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Download CSV
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
