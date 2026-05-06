"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { format } from "date-fns";
import { Building2, Home, Briefcase, UserX } from "lucide-react";

const MODE_ICON: Record<string, any> = { OFFICE: Building2, REMOTE: Home, HYBRID: Briefcase };

export function TeamAttendance() {
  const [data, setData] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch(`/api/attendance/team?date=${date}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => {});
  }, [date]);

  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {data.present.length} present · {data.absent.length} absent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 gradient-success text-white text-sm font-semibold">
            ✓ Present ({data.present.length})
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {data.present.map((r: any) => {
              const Icon = MODE_ICON[r.workMode] ?? Building2;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={r.user.name} src={r.user.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.clockIn), "h:mm a")} {r.clockOut ? `→ ${format(new Date(r.clockOut), "h:mm a")}` : "(active)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {r.isLate && <span className="text-[10px] text-amber-600 font-medium">LATE</span>}
                  </div>
                </div>
              );
            })}
            {data.present.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Nobody clocked in yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted text-muted-foreground text-sm font-semibold flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Absent ({data.absent.length})
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {data.absent.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={u.name} src={u.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.department ?? u.email}</p>
                </div>
              </div>
            ))}
            {data.absent.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Everyone is here! 🎉</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
