"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskListView } from "@/components/tasks/task-list-view";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { TaskCard } from "@/components/tasks/task-card";
import type { TaskStatus } from "@prisma/client";

export type TaskUser = { id: string; name: string; image: string | null };
export type Sprint = { id: string; name: string; status?: string; startDate?: string; endDate?: string };
export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedHrs: number | null;
  loggedHrs: number;
  dueDate: string | null;
  assigneeId: string;
  assignee: TaskUser;
  sprintId: string | null;
  sprint: { id: string; name: string } | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  workLogs?: { id: string; hours: number; description: string }[];
  activityLogs?: { id: string; action: string; createdAt: string; user?: { name: string } }[];
};

interface Props {
  initialTasks: Task[];
  sprints: Sprint[];
  users: TaskUser[];
  currentUserId: string;
}

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"];

export function TasksClient({ initialTasks, sprints, users, currentUserId }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredTasks =
    selectedSprintId === "all"
      ? tasks
      : tasks.filter((t) => t.sprintId === selectedSprintId);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      if (!COLUMNS.includes(newStatus)) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("Failed to update status");
      } catch {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
        toast.error("Failed to update task status");
      }
    },
    [tasks]
  );

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    setCreateOpen(false);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tasks"
        description="Manage and track your work"
        action={
          <div className="flex items-center gap-2">
            {/* Sprint filter */}
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="all">All Sprints</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setView("kanban")}
                className={`p-1.5 rounded-md transition-colors ${
                  view === "kanban"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  view === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        }
      />

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <KanbanBoard
            tasks={filteredTasks}
            columns={COLUMNS}
            onTaskClick={setSelectedTask}
          />
          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
        />
      )}

      {/* Floating add button */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 size-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
      >
        <Plus className="size-5" />
        <span className="sr-only">Create task</span>
      </button>

      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        sprints={sprints}
        users={users}
        currentUserId={currentUserId}
        onCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          sprints={sprints}
          users={users}
          onUpdate={(id, data) => {
            const existing = tasks.find((t) => t.id === id);
            if (existing) handleTaskUpdated({ ...existing, ...data } as Task);
          }}
          onDelete={handleTaskDeleted}
        />
      )}
    </div>
  );
}
