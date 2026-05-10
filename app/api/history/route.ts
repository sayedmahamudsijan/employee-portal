import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import type { Role } from "@prisma/client";

const VALID_SECTIONS = ["Workspace", "Growth", "Company", "Manage", "Admin", "Account"] as const;
type Section = (typeof VALID_SECTIONS)[number];

async function canAccessHistory(role: Role): Promise<boolean> {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "history" } });
  const allowedRoles: string[] = saved?.roles ?? DEFAULT_FEATURE_ACCESS.history;
  return allowedRoles.includes(role);
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const allowed = await canAccessHistory(session.user.role as Role);
  if (!allowed) return apiError("Access denied", 403);

  const { searchParams } = req.nextUrl;
  const section = searchParams.get("section") as Section | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const userId = searchParams.get("userId") ?? undefined;

  if (section && !VALID_SECTIONS.includes(section)) {
    return apiError(`Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`, 400);
  }

  const where: Record<string, any> = {};
  if (section) where.section = section;
  if (userId) where.userId = userId;

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
