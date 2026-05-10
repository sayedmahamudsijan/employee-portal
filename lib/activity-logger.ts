/**
 * Activity Logger — records every significant portal action to ActivityLog.
 * Only non-chat events are logged (team messages are explicitly excluded).
 *
 * Each log entry captures:
 *  - who  (userId)
 *  - what (action + entity + entityId)
 *  - where (section — maps to History sub-page)
 *  - change (oldValue / newValue for update events)
 *  - when (createdAt — auto set by Prisma)
 *  - details (human-readable one-liner)
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type LogSection =
  | "Workspace"
  | "Growth"
  | "Company"
  | "Manage"
  | "Admin"
  | "Account";

export type LogAction =
  | "Created"
  | "Updated"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Deleted"
  | "Activated"
  | "Deactivated"
  | "Cancelled"
  | "Completed"
  | "Assigned"
  | "Clocked In"
  | "Clocked Out"
  | "Pinned"
  | "Unpinned"
  | "Granted Access"
  | "Revoked Access";

interface LogEntry {
  userId: string;
  action: LogAction;
  entity: string;
  entityId?: string;
  section: LogSection;
  details: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  taskId?: string;
}

/**
 * Fire-and-forget activity log write.
 * Errors are swallowed so a logging failure never breaks the main operation.
 */
export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId:   entry.userId,
        action:   entry.action,
        entity:   entry.entity,
        entityId: entry.entityId,
        section:  entry.section,
        details:  entry.details,
        oldValue: (entry.oldValue ?? undefined) as Prisma.InputJsonValue | undefined,
        newValue: (entry.newValue ?? undefined) as Prisma.InputJsonValue | undefined,
        taskId:   entry.taskId,
      },
    });
  } catch {
    // Never let logging crash the request
  }
}

// ── Convenience helpers ─────────────────────────────────────────────────────

/** Diff two objects, returning only keys that changed */
export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } {
  const changedKeys = Object.keys(newObj).filter(
    (k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])
  );
  if (changedKeys.length === 0) return { old: {}, new: {} };
  return {
    old: Object.fromEntries(changedKeys.map((k) => [k, oldObj[k]])),
    new: Object.fromEntries(changedKeys.map((k) => [k, newObj[k]])),
  };
}
