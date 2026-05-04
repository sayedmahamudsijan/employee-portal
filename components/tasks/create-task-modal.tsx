"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { toast } from "sonner";
import type { TaskUser, Sprint, Task } from "@/components/tasks/tasks-client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: TaskUser[];
  sprints: Sprint[];
  defaultSprintId?: string;
  onCreated: (task: Task) => void;
  currentUserId: string;
}

export function CreateTaskModal({ open, onOpenChange, users, sprints, defaultSprintId, onCreated, currentUserId }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    assigneeId: currentUserId,
    sprintId: defaultSprintId ?? "",
    dueDate: "",
    estimatedHrs: "",
  });
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedHrs: form.estimatedHrs ? parseFloat(form.estimatedHrs) : undefined,
          sprintId: form.sprintId || undefined,
          dueDate: form.dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onCreated(data);
      onOpenChange(false);
      setForm({ title: "", description: "", priority: "MEDIUM", status: "TODO", assigneeId: currentUserId, sprintId: defaultSprintId ?? "", dueDate: "", estimatedHrs: "" });
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <Input
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"].map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={form.assigneeId} onValueChange={(v) => update("assigneeId", v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Assignee" /></SelectTrigger>
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
          <Select value={form.sprintId || "none"} onValueChange={(v) => update("sprintId", v === "none" ? "" : v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Sprint (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No sprint</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} className="h-9" />
            <Input type="number" step="0.5" placeholder="Est. hours" value={form.estimatedHrs} onChange={(e) => update("estimatedHrs", e.target.value)} className="h-9" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
