import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

/**
 * Bulk update users.
 * Body: { ids: string[], updates: { status?, role?, department? } }
 */
export async function PATCH(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { ids, updates } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return apiError("ids array is required");
  if (!updates || typeof updates !== "object") return apiError("updates object is required");

  const data: any = {};
  if (updates.status) data.status = updates.status;
  if (updates.role) data.role = updates.role;
  if (typeof updates.department === "string") data.department = updates.department;

  if (Object.keys(data).length === 0) return apiError("No valid fields to update");

  const result = await prisma.user.updateMany({
    where: { id: { in: ids } },
    data,
  });

  await logActivity({
    userId: session.user.id,
    action: "bulk-update",
    entity: "user",
    details: `Bulk updated ${result.count} user(s): ${Object.keys(data).join(", ")}`,
  });

  return apiResponse({ count: result.count });
}
