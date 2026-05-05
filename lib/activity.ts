import { prisma } from "@/lib/prisma";

/**
 * Log an activity action for audit trail.
 * Fail-soft: never throws, never blocks the calling action.
 */
export async function logActivity(params: {
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  taskId?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
        taskId: params.taskId ?? null,
      },
    });
  } catch (e) {
    console.error("[activity] failed to log:", e);
  }
}
