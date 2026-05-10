import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { logActivity } from "@/lib/activity-logger";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const saved = await prisma.featureAccess.findMany();
  // Merge saved overrides with defaults
  const result = Object.entries(DEFAULT_FEATURE_ACCESS).map(([feature, defaultRoles]) => {
    const override = saved.find((s) => s.feature === feature);
    return { feature, roles: override ? override.roles : defaultRoles };
  });
  return apiResponse(result);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await withRole("ADMIN");
  if (error || !session) return error;

  const { feature, roles } = await req.json();
  if (!feature || !Array.isArray(roles)) return apiError("Invalid payload", 400);

  // Fetch old value for logging
  const existing = await prisma.featureAccess.findUnique({ where: { feature } });
  const oldRoles = existing?.roles ?? DEFAULT_FEATURE_ACCESS[feature as keyof typeof DEFAULT_FEATURE_ACCESS] ?? [];

  const entry = await prisma.featureAccess.upsert({
    where: { feature },
    update: { roles },
    create: { feature, roles },
  });

  logActivity({
    userId: session.user.id,
    action: "Updated",
    entity: "FeatureAccess",
    entityId: feature,
    section: "Admin",
    details: `Updated access control for "${feature}": [${(oldRoles as string[]).join(", ")}] → [${roles.join(", ")}]`,
    oldValue: { feature, roles: oldRoles },
    newValue: { feature, roles },
  });

  return apiResponse(entry);
}
