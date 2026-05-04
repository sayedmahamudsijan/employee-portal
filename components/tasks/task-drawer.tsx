"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar } from "@/components/shared/avatar";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, Clock } from "lucide-react";
import type { Task, TaskUser, Sprint } from "@/components/tasks/tasks-client";
import type { TaskStatus, Priority } from "@prisma/client";

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  users: TaskUser[];
  sprints: Sprint[];
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskDrawer({ task, open, onClose, users, sprints, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState<Partial<Task>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) return null;

  const merged = { ...task, ...form };

  async function save() {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      const { data } = await res.json();
      onUpdate(task.id, data);
      setForm({});
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDelete(task.id);
      onClose();
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">Task Details</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input
                value={merged.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={merged.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Add a description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select
                  value={merged.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <StatusBadge status={s} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select
                  value={merged.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <PriorityBadge priority={p} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={merged.dueDate ? new Date(merged.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || null }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Est. Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  value={merged.estimatedHrs ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedHrs: parseFloat(e.target.value) || undefined }))}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Assignee</label>
              <Select
                value={merged.assigneeId}
                onValueChange={(v) => setForm((f) => ({ ...f, assigneeId: v ?? f.assigneeId }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar name={u.name} src={u.image} size="xs" />
                        {u.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sprint</label>
              <Select
                value={merged.sprintId ?? "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, sprintId: v === "none" ? null : v }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sprint</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma separated)</label>
              <Input
                value={merged.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  }))
                }
                placeholder="feature, bug, chore"
              />
            </div>

            {/* Hours summary */}
            <div className="rounded-lg bg-muted p-3 flex items-center gap-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">{task.loggedHrs}h logged</span>
                {task.estimatedHrs && (
                  <span className="text-muted-foreground"> / {task.estimatedHrs}h estimated</span>
                )}
              </div>
            </div>

            {/* Work logs */}
            {task.workLogs && task.workLogs.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Work Logs</label>
                <div className="space-y-1.5">
                  {task.workLogs.map((log) => (
                    <div key={log.id} className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{log.hours}h</span>
                      <span>{log.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity */}
            {task.activityLogs && task.activityLogs.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Activity</label>
                <div className="space-y-1.5">
                  {task.activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{log.user?.name}</span>{" "}
                      {log.action} · {timeAgo(log.createdAt)}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={save} disabled={saving || Object.keys(form).length === 0}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
