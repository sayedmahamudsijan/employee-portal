"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { formatDate } from "@/lib/utils";
import { Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: "IN_PROGRESS" | "COMPLETED" | "MISSED";
  dueDate: string | null;
  quarter: string;
  year: number;
};

interface Props {
  goal: Goal;
  onUpdated: (g: Goal) => void;
  onDeleted: (id: string) => void;
}

export function GoalCard({ goal, onUpdated, onDeleted }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    description: goal.description ?? "",
    progress: goal.progress,
    status: goal.status,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onUpdated(data);
      setEditOpen(false);
      toast.success("Goal updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    onDeleted(goal.id);
    toast.success("Goal deleted");
  }

  const progressColor =
    goal.progress >= 80 ? "text-green-600 dark:text-green-400"
    : goal.progress >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-muted-foreground";

  return (
    <>
      <div
        className="rounded-xl border border-border bg-card p-5 space-y-3 cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => {
          setForm({ description: goal.description ?? "", progress: goal.progress, status: goal.status });
          setEditOpen(true);
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{goal.title}</h3>
          <StatusBadge status={goal.status} />
        </div>

        <div className="flex items-center gap-2">
          <Progress value={goal.progress} className="h-1.5 flex-1" />
          <span className={`text-xs font-semibold ${progressColor} w-8 text-right`}>{goal.progress}%</span>
        </div>

        {goal.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(goal.dueDate)}
          </div>
        )}
        {goal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{goal.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Progress — <span className="font-semibold text-foreground">{form.progress}%</span>
              </label>
              <Slider
                value={[form.progress]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? (v as number[])[0] : (v as number);
                  setForm((f) => ({ ...f, progress: val }));
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as Goal["status"] }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete goal?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
