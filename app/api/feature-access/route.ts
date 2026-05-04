import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole, requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";

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
  const { error } = await withRole("ADMIN");
  if (error) return error;

  const { feature, roles } = await req.json();
  if (!feature || !Array.isArray(roles)) return apiError("Invalid payload", 400);

  const entry = await prisma.featureAccess.upsert({
    where: { feature },
    update: { roles },
    create: { feature, roles },
  });
  return apiResponse(entry);
}
