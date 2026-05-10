import { requireAuth } from "@/lib/server-auth";
import { apiResponse, apiError } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { FEATURES } from "@/lib/feature-access";

const EXEC_ROLES = ["CEO", "CMO", "CTO", "ADMIN"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  const { id } = await params;

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  // Find all FeatureAccess entries where this customRoleId is in the roles array
  const entries = await prisma.featureAccess.findMany({
    where: { roles: { has: id } },
  });

  const features = entries.map((e) => e.feature);

  return apiResponse({ features });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error || !session) return error!;

  if (!EXEC_ROLES.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { features } = body as { features: string[] };

  if (!Array.isArray(features)) return apiError("features must be an array");

  const existing = await prisma.customRole.findUnique({ where: { id } });
  if (!existing) return apiError("Custom role not found", 404);

  // For each feature in FEATURES list, upsert or remove the customRoleId
  for (const feat of FEATURES) {
    const featureKey = feat.key;
    const shouldHaveAccess = features.includes(featureKey);

    const entry = await prisma.featureAccess.findUnique({
      where: { feature: featureKey },
    });

    if (shouldHaveAccess) {
      if (!entry) {
        // Create new entry with just this custom role id
        await prisma.featureAccess.create({
          data: { feature: featureKey, roles: [id] },
        });
      } else {
        const currentRoles = entry.roles as string[];
        if (!currentRoles.includes(id)) {
          await prisma.featureAccess.update({
            where: { feature: featureKey },
            data: { roles: [...currentRoles, id] },
          });
        }
      }
    } else {
      if (entry) {
        const currentRoles = entry.roles as string[];
        if (currentRoles.includes(id)) {
          await prisma.featureAccess.update({
            where: { feature: featureKey },
            data: { roles: currentRoles.filter((r) => r !== id) },
          });
        }
      }
    }
  }

  return apiResponse({ updated: true });
}
