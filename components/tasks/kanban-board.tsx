"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "@/components/tasks/sortable-task-card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Task } from "@/components/tasks/tasks-client";
import type { TaskStatus } from "@prisma/client";

const COLUMN_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function KanbanColumn({ status, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground font-medium ml-auto">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors ${
          isOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/40"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

interface BoardProps {
  tasks: Task[];
  columns: TaskStatus[];
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, columns, onTaskClick }: BoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
