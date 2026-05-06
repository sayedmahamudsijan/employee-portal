"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/shared/avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Calendar, Users as UsersIcon, ChevronRight } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "gradient-success text-white",
  CANCELLED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  RESCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function OneOnOneList({
  initial, reports, currentUserId,
}: {
  initial: any[];
  reports: any[];
  currentUserId: string;
  userManagerId: string | null;
}) {
  const [meetings, setMeetings] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [form, setForm] = useState({ reportId: "", scheduledAt: "", durationMin: 30, agenda: "" });

  async function schedule() {
    if (!form.reportId || !form.scheduledAt) return toast.error("Report and date required");
    try {
      const res = await fetch("/api/one-on-ones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMeetings([json.data, ...meetings]);
      setShowAdd(false);
      setForm({ reportId: "", scheduledAt: "", durationMin: 30, agenda: "" });
      toast.success("1:1 scheduled");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function update(id: string, data: any) {
    try {
      const res = await fetch(`/api/one-on-ones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMeetings((m) => m.map((x) => (x.id === id ? { ...x, ...json.data } : x)));
      if (active?.id === id) setActive({ ...active, ...json.data });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  const upcoming = meetings.filter((m) => m.status === "SCHEDULED" && new Date(m.scheduledAt) >= new Date());
  const past = meetings.filter((m) => m.status !== "SCHEDULED" || new Date(m.scheduledAt) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{meetings.length} meeting(s)</p>
        {reports.length > 0 && (
          <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
            <Plus className="w-4 h-4 mr-1.5" /> Schedule 1:1
          </Button>
        )}
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming 1:1s.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {upcoming.map((m) => {
              const other = m.managerId === currentUserId ? m.report : m.manager;
              return (
                <button key={m.id} onClick={() => setActive(m)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 text-left">
                  <Avatar name={other.name} src={other.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{other.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.scheduledAt), "EEE, MMM d 'at' h:mm a")} · {m.durationMin} min
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Past ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-xs text-muted-foreground">No past 1:1s yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {past.slice(0, 10).map((m) => {
              const other = m.managerId === currentUserId ? m.report : m.manager;
              return (
                <button key={m.id} onClick={() => setActive(m)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 text-left opacity-80">
                  <Avatar name={other.name} src={other.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{other.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(m.scheduledAt), "MMM d, yyyy")}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Schedule dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Schedule 1:1</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.reportId} onValueChange={(v) => setForm({ ...form, reportId: v })}>
              <SelectTrigger><SelectValue placeholder="Report" /></SelectTrigger>
              <SelectContent>{reports.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            <Select value={String(form.durationMin)} onValueChange={(v) => setForm({ ...form, durationMin: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90].map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Agenda (optional)" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={schedule} className="gradient-brand text-white border-0">Schedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        {active && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar name={(active.managerId === currentUserId ? active.report : active.manager).name} src={(active.managerId === currentUserId ? active.report : active.manager).image} size="sm" />
                1:1 with {(active.managerId === currentUserId ? active.report : active.manager).name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {format(new Date(active.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")} · {active.durationMin} min
              </p>

              {active.managerId === currentUserId && (
                <div>
                  <label className="text-xs text-muted-foreground">Agenda</label>
                  <Textarea
                    defaultValue={active.agenda ?? ""}
                    onBlur={(e) => update(active.id, { agenda: e.target.value })}
                    rows={3}
                    placeholder="What to talk about…"
                  />
                </div>
              )}
              {active.managerId !== currentUserId && active.agenda && (
                <div>
                  <label className="text-xs text-muted-foreground">Agenda</label>
                  <p className="text-sm whitespace-pre-wrap mt-1 rounded-md bg-muted p-3">{active.agenda}</p>
                </div>
              )}

              {active.managerId === currentUserId ? (
                <div>
                  <label className="text-xs text-muted-foreground">Manager Notes (only you can see)</label>
                  <Textarea
                    defaultValue={active.managerNotes ?? ""}
                    onBlur={(e) => update(active.id, { managerNotes: e.target.value })}
                    rows={4}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground">Your Notes (only you can see)</label>
                  <Textarea
                    defaultValue={active.reportNotes ?? ""}
                    onBlur={(e) => update(active.id, { reportNotes: e.target.value })}
                    rows={4}
                  />
                </div>
              )}

              {active.managerId === currentUserId && (
                <div className="flex gap-2">
                  {active.status === "SCHEDULED" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => update(active.id, { status: "COMPLETED" })}>Mark Complete</Button>
                      <Button size="sm" variant="outline" onClick={() => update(active.id, { status: "CANCELLED" })}>Cancel</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
