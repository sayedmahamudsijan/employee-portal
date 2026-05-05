import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

/**
 * Bulk-update tasks (reassign, change status, change priority, add tags).
 * Body: { ids: string[], updates: { assigneeId?, status?, priority?, sprintId?, addTags?: string[] } }
 */
export async function PATCH(req: NextRequest) {
  const { session, error } = await withRole("MANAGER");
  if (error || !session) return error;

  const { ids, updates } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return apiError("ids required");

  const baseData: any = {};
  if (updates.assigneeId) baseData.assigneeId = updates.assigneeId;
  if (updates.status) baseData.status = updates.status;
  if (updates.priority) baseData.priority = updates.priority;
  if ("sprintId" in updates) baseData.sprintId = updates.sprintId;

  if (Object.keys(baseData).length > 0) {
    await prisma.task.updateMany({ where: { id: { in: ids } }, data: baseData });
  }

  // Tag merging needs per-row update
  if (Array.isArray(updates.addTags) && updates.addTags.length > 0) {
    const tasks = await prisma.task.findMany({ where: { id: { in: ids } }, select: { id: true, tags: true } });
    await Promise.all(
      tasks.map((t) =>
        prisma.task.update({
          where: { id: t.id },
          data: { tags: Array.from(new Set([...t.tags, ...updates.addTags])) },
        })
      )
    );
  }

  await logActivity({
    userId: session.user.id,
    action: "bulk-update",
    entity: "task",
    details: `Bulk updated ${ids.length} task(s)`,
  });

  return apiResponse({ count: ids.length });
}
