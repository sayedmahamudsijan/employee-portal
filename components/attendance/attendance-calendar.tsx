"use client";

import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { useMemo } from "react";

type Record = {
  date: string;
  clockIn: string;
  clockOut: string | null;
  durationMin: number | null;
  workMode: string;
  isLate: boolean;
};

export function AttendanceCalendar({ records }: { records: Record[] }) {
  const today = new Date();
  const days = getDaysInMonth(today);
  const startWeekday = getDay(startOfMonth(today));

  const byDate = useMemo(() => {
    const m = new Map<number, Record>();
    records.forEach((r) => m.set(new Date(r.date).getDate(), r));
    return m;
  }, [records]);

  const totalHours = records.reduce((sum, r) => sum + (r.durationMin ?? 0), 0) / 60;
  const presentDays = records.length;
  const lateDays = records.filter((r) => r.isLate).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Days Present</p>
          <p className="text-2xl font-bold gradient-text">{presentDays}</p>
        </div>
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Total Hours</p>
          <p className="text-2xl font-bold gradient-text">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Late Arrivals</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateDays}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">{format(today, "MMMM yyyy")}</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-xs text-center text-muted-foreground font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: startWeekday }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const record = byDate.get(day);
            const isToday = day === today.getDate();
            const isWeekend = (startWeekday + i) % 7 === 0 || (startWeekday + i) % 7 === 6;

            let bg = "bg-muted/30 text-muted-foreground";
            if (record?.clockOut) bg = "gradient-success text-white";
            else if (record) bg = "gradient-info text-white";
            if (record?.isLate) bg = "gradient-warning text-white";
            if (isWeekend && !record) bg = "bg-muted/10 text-muted-foreground/50";

            return (
              <div
                key={day}
                className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium ${bg} ${isToday ? "ring-2 ring-primary" : ""}`}
                title={record ? `${record.workMode} · ${((record.durationMin ?? 0) / 60).toFixed(1)}h${record.isLate ? " · Late" : ""}` : ""}
              >
                <span>{day}</span>
                {record?.durationMin !== null && record?.durationMin !== undefined && (
                  <span className="text-[9px] opacity-80">{((record.durationMin ?? 0) / 60).toFixed(1)}h</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm gradient-success" /> Complete</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm gradient-info" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm gradient-warning" /> Late</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted/30" /> Absent</span>
        </div>
      </div>
    </div>
  );
}
