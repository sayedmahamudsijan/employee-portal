import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { EXECUTIVE_ROLES } from "@/lib/roles";
import type { Role } from "@prisma/client";

const VALID_SECTIONS = ["Workspace", "Growth", "Company", "Manage", "Admin", "Account"] as const;
type Section = (typeof VALID_SECTIONS)[number];

async function canAccessHistory(role: Role): Promise<boolean> {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "history" } });
  const allowedRoles: string[] = (saved?.roles as string[]) ?? (DEFAULT_FEATURE_ACCESS.history as string[]);
  return allowedRoles.includes(role);
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const allowed = await canAccessHistory(session.user.role as Role);
  if (!allowed) return apiError("Access denied", 403);

  const { searchParams } = req.nextUrl;
  const section  = searchParams.get("section") as Section | null;
  const entity   = searchParams.get("entity") ?? undefined;
  const action   = searchParams.get("action") ?? undefined;
  const actorId  = searchParams.get("actorId") ?? undefined;
  const entityId = searchParams.get("entityId") ?? undefined;
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

  if (section && !VALID_SECTIONS.includes(section)) {
    return apiError(`Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`, 400);
  }

  const where: Record<string, any> = {};
  if (section)  where.section  = section;
  if (entity)   where.entity   = entity;
  if (action)   where.action   = action;
  if (actorId)  where.userId   = actorId;
  if (entityId) where.entityId = entityId;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return apiResponse(logs, { total, page, limit, pages: Math.ceil(total / limit) });
}

// DELETE a single log entry — executives only
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  if (!EXECUTIVE_ROLES.includes(session.user.role as any)) {
    return apiError("Only CEO, CMO, or CTO can delete history entries", 403);
  }

  const { id } = await req.json();
  if (!id) return apiError("id is required", 400);

  try {
    await prisma.activityLog.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch {
    return apiError("Entry not found or already deleted", 404);
  }
}
