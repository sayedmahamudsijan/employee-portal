"use client";

import { Avatar } from "@/components/shared/avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { formatDate } from "@/lib/utils";
import { GripVertical, Clock, Calendar } from "lucide-react";
import type { Task } from "@/components/tasks/tasks-client";

interface Props {
  task: Task;
  onClick: () => void;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, dragListeners, dragAttributes, isDragging }: Props) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-3 space-y-2.5 cursor-pointer hover:border-primary/30 transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0 cursor-grab active:cursor-grabbing"
          {...dragListeners}
          {...dragAttributes}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <p className="text-sm font-medium text-foreground leading-snug flex-1">{task.title}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.tags?.[0] && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {task.tags[0]}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar name={task.assignee.name} src={task.assignee.image} size="xs" />
          <span className="text-xs text-muted-foreground truncate max-w-20">
            {task.assignee.name.split(" ")[0]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.estimatedHrs && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {task.estimatedHrs}h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
