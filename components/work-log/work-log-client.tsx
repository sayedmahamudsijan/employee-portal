"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { WorkLogPanel, type WorkLog } from "@/components/work-log/work-log-panel";
import { PageHeader } from "@/components/shared/page-header";

type Task = { id: string; title: string };

interface Props {
  initialLogs: WorkLog[];
  tasks: Task[];
  userId: string;
}

// Dot colour per status shown on calendar cells
const STATUS_DOT: Record<WorkLog["status"], string> = {
  DRAFT:     "bg-muted-foreground/60",
  SUBMITTED: "bg-amber-400",
  APPROVED:  "bg-green-500",
  REJECTED:  "bg-red-500",
};

export function WorkLogClient({ initialLogs, tasks, userId }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<WorkLog[]>(initialLogs);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const logsByDate = logs.reduce<Record<string, WorkLog[]>>((acc, log) => {
    const key = format(new Date(log.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const selectedLogs = selectedDate
    ? (logsByDate[format(selectedDate, "yyyy-MM-dd")] ?? [])
    : [];

  // Summary counts for the month
  const monthLogs  = logs.filter((l) => isSameMonth(new Date(l.date), currentMonth));
  const approved   = monthLogs.filter((l) => l.status === "APPROVED").length;
  const pending    = monthLogs.filter((l) => l.status === "SUBMITTED").length;
  const rejected   = monthLogs.filter((l) => l.status === "REJECTED").length;
  const totalHours = monthLogs.reduce((s, l) => s + l.hours, 0);

  function handleLogAdded(log: WorkLog) {
    setLogs((prev) => [...prev, log]);
  }
  function handleLogDeleted(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }
  function handleLogUpdated(updated: WorkLog) {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div>
      <PageHeader title="Work Log" description="Track your daily work hours and submit for manager review" />

      {/* Month summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, icon: <Clock className="w-4 h-4 text-primary" /> },
          { label: "Approved",    value: approved,  icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
          { label: "Pending",     value: pending,   icon: <Clock className="w-4 h-4 text-amber-500" /> },
          { label: "Rejected",    value: rejected,  icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl card-festive p-3 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key     = format(day, "yyyy-MM-dd");
              const dayLogs = logsByDate[key] ?? [];
              const totalH  = dayLogs.reduce((sum, l) => sum + l.hours, 0);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday    = isSameDay(day, new Date());
              const inMonth    = isSameMonth(day, currentMonth);

              // Dominant status dot (approved > submitted > rejected > draft)
              const dominantStatus = dayLogs.find((l) => l.status === "APPROVED")?.status
                ?? dayLogs.find((l) => l.status === "SUBMITTED")?.status
                ?? dayLogs.find((l) => l.status === "REJECTED")?.status
                ?? dayLogs[0]?.status;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative h-14 rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-0.5",
                    isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    !inMonth && "opacity-30"
                  )}
                >
                  <span className="font-medium leading-none">{format(day, "d")}</span>
                  {totalH > 0 && (
                    <span className={cn("text-[9px] font-medium leading-none", isSelected ? "text-primary-foreground/80" : "text-primary")}>
                      {totalH}h
                    </span>
                  )}
                  {/* Status dot */}
                  {dominantStatus && (
                    <span className={cn("w-1.5 h-1.5 rounded-full absolute bottom-1.5", isSelected ? "bg-white/70" : STATUS_DOT[dominantStatus])} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            {(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", STATUS_DOT[s])} />
                <span className="text-[10px] text-muted-foreground capitalize">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log panel */}
        {selectedDate && (
          <WorkLogPanel
            date={selectedDate}
            logs={selectedLogs}
            tasks={tasks}
            userId={userId}
            onLogAdded={handleLogAdded}
            onLogDeleted={handleLogDeleted}
            onLogUpdated={handleLogUpdated}
          />
        )}
      </div>
    </div>
  );
}
