import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { EXECUTIVE_ROLES } from "@/lib/roles";

/**
 * POST /api/history/cleanup
 * Body: { olderThan: ISO string, section?: string }
 * Deletes all ActivityLog entries older than the given date, optionally filtered by section.
 * Only CEO/CMO/CTO can do this.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  if (!EXECUTIVE_ROLES.includes(session.user.role as any)) {
    return apiError("Only CEO, CMO, or CTO can erase history", 403);
  }

  const body = await req.json();
  const { olderThan, section } = body;

  if (!olderThan) return apiError("olderThan is required", 400);

  const cutoff = new Date(olderThan);
  if (isNaN(cutoff.getTime())) return apiError("olderThan must be a valid date", 400);

  const where: Record<string, any> = { createdAt: { lt: cutoff } };
  if (section) where.section = section;

  const { count } = await prisma.activityLog.deleteMany({ where });
  return apiResponse({ deleted: count, olderThan: cutoff, section: section ?? "all" });
}
