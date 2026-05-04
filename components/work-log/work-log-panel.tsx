"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Clock } from "lucide-react";

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
  date: Date;
  logs: WorkLog[];
  tasks: Task[];
  userId: string;
  onLogAdded: (log: WorkLog) => void;
  onLogDeleted: (id: string) => void;
}

export function WorkLogPanel({ date, logs, tasks, userId, onLogAdded, onLogDeleted }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ taskId: "", hours: "", description: "" });
  const [saving, setSaving] = useState(false);

  const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hours || !form.description) return toast.error("Hours and description are required");
    setSaving(true);
    try {
      const res = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskId: form.taskId || undefined,
          date: date.toISOString(),
          hours: parseFloat(form.hours),
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onLogAdded(data);
      setForm({ taskId: "", hours: "", description: "" });
      setAdding(false);
      toast.success("Work logged");
    } catch {
      toast.error("Failed to log work");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog(id: string) {
    try {
      await fetch(`/api/worklogs/${id}`, { method: "DELETE" });
      onLogDeleted(id);
      toast.success("Log removed");
    } catch {
      toast.error("Failed to delete log");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{format(date, "EEEE, MMM d")}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            {totalHours}h total
          </div>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Existing logs */}
      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 group">
              <div className="flex-1 rounded-lg bg-muted/50 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{log.hours}h</span>
                  {log.task && (
                    <span className="text-xs text-primary truncate">{log.task.title}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
              </div>
              <button
                className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => deleteLog(log.id)}
                aria-label="Delete log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {logs.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-4">No entries for this day.</p>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={addLog} className="space-y-2.5 border-t border-border pt-4">
          <Select value={form.taskId} onValueChange={(v) => setForm((f) => ({ ...f, taskId: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Link to task (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No task</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            placeholder="Hours *"
            value={form.hours}
            onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            className="h-8 text-sm"
            required
          />
          <Textarea
            placeholder="What did you work on? *"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="text-sm"
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Log Work"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
