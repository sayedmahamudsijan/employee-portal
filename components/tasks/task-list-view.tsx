"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Task } from "@/components/tasks/tasks-client";
import type { TaskStatus, Priority } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type SortKey = "title" | "status" | "priority" | "dueDate" | "loggedHrs";

const PRIORITY_ORDER: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };
const STATUS_ORDER: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, DONE: 3, BLOCKED: 4 };

export function TaskListView({ tasks, onTaskClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = tasks
    .filter((t) => filterStatus === "ALL" || t.status === filterStatus)
    .filter((t) => filterPriority === "ALL" || t.priority === filterPriority)
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "title") diff = a.title.localeCompare(b.title);
      else if (sortKey === "status") diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      else if (sortKey === "priority") diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        diff = da - db;
      } else if (sortKey === "loggedHrs") diff = a.loggedHrs - b.loggedHrs;
      return sortDir === "asc" ? diff : -diff;
    });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-auto">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
          <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("title")}>
            Title <SortIcon col="title" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("status")}>
            Status <SortIcon col="status" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("priority")}>
            Priority <SortIcon col="priority" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("dueDate")}>
            Due <SortIcon col="dueDate" />
          </button>
          <button className="flex items-center gap-1" onClick={() => toggleSort("loggedHrs")}>
            Hours <SortIcon col="loggedHrs" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks match filters</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={task.assignee.name} src={task.assignee.image} size="xs" />
                  <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                </div>
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </span>
                <span className="text-xs text-muted-foreground text-right">
                  {task.loggedHrs}h{task.estimatedHrs ? `/${task.estimatedHrs}h` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
