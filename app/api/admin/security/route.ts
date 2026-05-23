import { NextRequest } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/admin/security?event=&severity=&userId=&email=&limit=
 *
 * Returns the most recent SecurityEvent rows, newest first. Restricted to
 * executive roles (CEO/CMO/CTO). Admins below executive can call it too
 * (withRole("ADMIN") includes all higher levels).
 */
const QuerySchema = z.object({
  event:    z.string().trim().max(64).optional(),
  severity: z.enum(["info", "warn", "critical"]).optional(),
  userId:   z.string().trim().max(40).optional(),
  email:    z.string().trim().max(254).optional(),
  ip:       z.string().trim().max(64).optional(),
  limit:    z.coerce.number().int().min(1).max(500).default(100),
});

export async function GET(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    event:    searchParams.get("event")    ?? undefined,
    severity: searchParams.get("severity") ?? undefined,
    userId:   searchParams.get("userId")   ?? undefined,
    email:    searchParams.get("email")    ?? undefined,
    ip:       searchParams.get("ip")       ?? undefined,
    limit:    searchParams.get("limit")    ?? undefined,
  });
  if (!parsed.success) {
    return apiResponse({ events: [] });
  }
  const q = parsed.data;

  const events = await prisma.securityEvent.findMany({
    where: {
      ...(q.event    ? { event:    q.event } : {}),
      ...(q.severity ? { severity: q.severity } : {}),
      ...(q.userId   ? { userId:   q.userId } : {}),
      ...(q.email    ? { email:    q.email.toLowerCase() } : {}),
      ...(q.ip       ? { ip:       q.ip } : {}),
    },
    orderBy: { createdAt: "desc" },
    take:    q.limit,
  });

  return apiResponse({ events });
}
