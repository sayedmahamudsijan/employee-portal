"use client";

import { useEffect, useMemo, useState } from "react";
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from "date-fns";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";

type Event = {
  type: "leave" | "holiday" | "birthday" | "anniversary";
  title: string;
  startDate: string;
  endDate: string;
  user?: { id: string; name: string; image: string | null };
};

const TYPE_STYLE: Record<string, string> = {
  leave: "gradient-info text-white",
  holiday: "gradient-warning text-white",
  birthday: "bg-pink-500 text-white",
  anniversary: "bg-purple-500 text-white",
};

export function TeamCalendarView() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = format(cursor, "yyyy-MM");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?month=${monthStr}`)
      .then((r) => r.json())
      .then((j) => setEvents(j.data ?? []))
      .finally(() => setLoading(false));
  }, [monthStr]);

  const days = getDaysInMonth(cursor);
  const startWeekday = getDay(startOfMonth(cursor));

  // Group events by day
  const byDay = useMemo(() => {
    const m = new Map<number, Event[]>();
    for (const e of events) {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const d = new Date(start);
      d.setHours(0, 0, 0, 0);
      while (d <= end) {
        if (d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
          const day = d.getDate();
          if (!m.has(day)) m.set(day, []);
          m.get(day)!.push(e);
        }
        d.setDate(d.getDate() + 1);
      }
    }
    return m;
  }, [events, cursor]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold gradient-text min-w-44 text-center">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm gradient-info" /> Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm gradient-warning" /> Holiday</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-500" /> Birthday</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500" /> Anniversary</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs text-center text-muted-foreground font-medium py-1.5">{d}</div>
          ))}
          {Array.from({ length: startWeekday }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dayEvents = byDay.get(day) ?? [];
            const isToday = day === new Date().getDate() && cursor.getMonth() === new Date().getMonth() && cursor.getFullYear() === new Date().getFullYear();
            const isWeekend = (startWeekday + i) % 7 === 0 || (startWeekday + i) % 7 === 6;

            return (
              <div
                key={day}
                className={`min-h-24 rounded-lg border border-border p-1.5 ${isWeekend ? "bg-muted/20" : "bg-background"} ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                <p className={`text-xs font-medium ${isToday ? "gradient-text" : "text-foreground"} mb-1`}>{day}</p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <div
                      key={idx}
                      className={`text-[10px] rounded px-1 py-0.5 truncate ${TYPE_STYLE[e.type]}`}
                      title={e.title}
                    >
                      {e.user && <span className="mr-1">{e.user.name.split(" ")[0]}</span>}
                      {e.type === "holiday" && e.title}
                      {e.type === "birthday" && "🎂"}
                      {e.type === "anniversary" && "🎉"}
                      {e.type === "leave" && "Off"}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground text-center">Loading…</p>}

      {/* Upcoming list */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">All events this month</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No events.</p>
        ) : (
          <div className="space-y-2">
            {events
              .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
              .map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${TYPE_STYLE[e.type]}`}>
                    {e.type}
                  </span>
                  {e.user && <Avatar name={e.user.name} src={e.user.image} size="xs" />}
                  <span className="flex-1 truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(e.startDate), "MMM d")}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
