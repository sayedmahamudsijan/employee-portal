"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WorkLogPanel } from "@/components/work-log/work-log-panel";
import { PageHeader } from "@/components/shared/page-header";

type WorkLog = {
  id: string;
  date: string;
  hours: number;
  description: string;
  taskId: string | null;
  task: { id: string; title: string } | null;
};

type Task = { id: string; title: string };

interface Props {
  initialLogs: WorkLog[];
  tasks: Task[];
  userId: string;
}

export function WorkLogClient({ initialLogs, tasks, userId }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<WorkLog[]>(initialLogs);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const logsByDate = logs.reduce<Record<string, WorkLog[]>>((acc, log) => {
    const key = format(new Date(log.date), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const selectedLogs = selectedDate
    ? (logsByDate[format(selectedDate, "yyyy-MM-dd")] ?? [])
    : [];

  function handleLogAdded(log: WorkLog) {
    setLogs((prev) => [...prev, log]);
  }
  function handleLogDeleted(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <PageHeader title="Work Log" description="Track your daily work hours" />

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
              const key = format(day, "yyyy-MM-dd");
              const dayLogs = logsByDate[key] ?? [];
              const totalHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const inMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative h-12 rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-0.5",
                    isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    !inMonth && "opacity-30"
                  )}
                >
                  <span className="font-medium leading-none">{format(day, "d")}</span>
                  {totalHours > 0 && (
                    <span className={cn("text-[9px] font-medium leading-none", isSelected ? "text-primary-foreground/80" : "text-primary")}>
                      {totalHours}h
                    </span>
                  )}
                </button>
              );
            })}
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
          />
        )}
      </div>
    </div>
  );
}
