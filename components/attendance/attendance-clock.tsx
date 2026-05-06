"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { Play, Square, Building2, Home, Briefcase } from "lucide-react";

type Record = {
  id: string;
  clockIn: string;
  clockOut: string | null;
  workMode: "OFFICE" | "REMOTE" | "HYBRID";
  notes: string | null;
  isLate: boolean;
  durationMin: number | null;
};

const MODE_ICON = { OFFICE: Building2, REMOTE: Home, HYBRID: Briefcase };

export function AttendanceClock({ initialToday }: { initialToday: Record | null }) {
  const [record, setRecord] = useState<Record | null>(initialToday);
  const [workMode, setWorkMode] = useState<"OFFICE" | "REMOTE" | "HYBRID">("OFFICE");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function clockIn() {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workMode, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRecord(json.data);
      toast.success(json.data.isLate ? "Clocked in (marked late)" : "Welcome! Clocked in");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function clockOut() {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/clock-out", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRecord(json.data);
      toast.success("Clocked out. Have a great day!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  const isClockedIn = record && !record.clockOut;
  const isDone = record && record.clockOut;

  // Live duration
  const durationMs = record?.clockIn
    ? (record.clockOut ? new Date(record.clockOut).getTime() : now.getTime()) - new Date(record.clockIn).getTime()
    : 0;
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  return (
    <div className="rounded-2xl gradient-brand-soft border border-border p-6 sm:p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-sm text-muted-foreground">{format(now, "EEEE, MMMM d, yyyy")}</p>
        <div className="text-5xl sm:text-6xl font-bold gradient-text tabular-nums">
          {format(now, "HH:mm:ss")}
        </div>

        {!record && (
          <div className="space-y-3 w-full max-w-sm">
            <Select value={workMode} onValueChange={(v) => setWorkMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OFFICE"><Building2 className="w-4 h-4 inline mr-2" />Office</SelectItem>
                <SelectItem value="REMOTE"><Home className="w-4 h-4 inline mr-2" />Remote / Work from home</SelectItem>
                <SelectItem value="HYBRID"><Briefcase className="w-4 h-4 inline mr-2" />Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button onClick={clockIn} disabled={busy} size="lg" className="w-full gradient-brand text-white border-0 glow-primary">
              <Play className="w-5 h-5 mr-2" />
              {busy ? "Clocking in…" : "Clock In"}
            </Button>
          </div>
        )}

        {isClockedIn && record && (
          <div className="space-y-4 w-full max-w-sm">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Active session</p>
              <div className="text-3xl font-bold tabular-nums">
                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Started at {format(new Date(record.clockIn), "h:mm a")} · {record.workMode}
                {record.isLate && <span className="ml-2 text-amber-600">(Late)</span>}
              </p>
            </div>
            <Button onClick={clockOut} disabled={busy} size="lg" variant="outline" className="w-full">
              <Square className="w-5 h-5 mr-2" />
              {busy ? "Clocking out…" : "Clock Out"}
            </Button>
          </div>
        )}

        {isDone && record && (
          <div className="rounded-xl bg-card border border-border p-4 w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-1">Today's hours</p>
            <div className="text-3xl font-bold tabular-nums">
              {Math.floor((record.durationMin ?? 0) / 60)}h {(record.durationMin ?? 0) % 60}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(record.clockIn), "h:mm a")} → {format(new Date(record.clockOut!), "h:mm a")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
