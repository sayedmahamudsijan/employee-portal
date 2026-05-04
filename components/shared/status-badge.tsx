import { cn } from "@/lib/utils";
import type { TaskStatus, LeaveStatus, GoalStatus, SprintStatus, UserStatus } from "@prisma/client";

type AnyStatus = TaskStatus | LeaveStatus | GoalStatus | SprintStatus | UserStatus | string;

const STATUS_STYLES: Record<string, string> = {
  // Task statuses
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_REVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  BLOCKED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Leave statuses
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  // Goal statuses
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MISSED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Sprint statuses
  PLANNED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  // User statuses
  INACTIVE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  MISSED: "Missed",
  PLANNED: "Planned",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

interface Props {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", style, className)}>
      {label}
    </span>
  );
}
