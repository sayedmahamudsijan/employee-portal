import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server-auth";
import { getCompanySettings, upsertCompanySettings } from "@/lib/company-settings";
import { apiResponse, apiError } from "@/lib/utils";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { logActivity } from "@/lib/activity-logger";
import type { Role } from "@prisma/client";

/** Check whether a role has the "design" feature enabled (DB override or default). */
async function canAccessDesign(role: Role): Promise<boolean> {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "design" } });
  const roles: string[] = (saved?.roles as string[]) ?? (DEFAULT_FEATURE_ACCESS.design as string[]);
  return roles.includes(role);
}

// ── GET — return current design config (any authenticated user can read) ──────
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const settings = await getCompanySettings();
  return apiResponse({ designConfig: settings.designConfig });
}

// ── PATCH — update designConfig (requires "design" feature access) ────────────
// Body: { designConfig: DesignConfig }
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const allowed = await canAccessDesign(session.user.role as Role);
  if (!allowed) return apiError("You do not have permission to edit Portal Design settings", 403);

  const body = await req.json();
  const { designConfig } = body;

  if (typeof designConfig !== "object" || designConfig === null || Array.isArray(designConfig)) {
    return apiError("designConfig must be a JSON object", 400);
  }

  // Sanitise: only allow known top-level keys
  const allowed_keys = ["portalTitle", "logoUrl", "faviconUrl", "primaryColor", "sections", "navItems"];
  const clean: Record<string, unknown> = {};
  for (const key of allowed_keys) {
    if (key in designConfig) clean[key] = designConfig[key];
  }

  const old = await getCompanySettings();

  await upsertCompanySettings({ designConfig: clean as any }, session.user.id);

  logActivity({
    userId: session.user.id,
    action: "Updated",
    entity: "CompanySettings",
    section: "Admin",
    details: `Updated portal design config (${Object.keys(clean).join(", ")})`,
    oldValue: { designConfig: old.designConfig },
    newValue: { designConfig: clean },
  });

  return apiResponse({ designConfig: clean });
}

// ── PUT — update design feature access roles ───────────────────────────────────
// Body: { roles: string[] }
export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const allowed = await canAccessDesign(session.user.role as Role);
  if (!allowed) return apiError("You do not have permission to edit Portal Design settings", 403);

  const body = await req.json();
  const { roles } = body;

  if (!Array.isArray(roles)) return apiError("roles must be an array", 400);

  const VALID_ROLES = ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"];
  const cleaned = roles.filter((r) => VALID_ROLES.includes(r));

  const old = await prisma.featureAccess.findUnique({ where: { feature: "design" } });

  await prisma.featureAccess.upsert({
    where:  { feature: "design" },
    create: { feature: "design", roles: cleaned },
    update: { roles: cleaned },
  });

  logActivity({
    userId: session.user.id,
    action: "Updated",
    entity: "FeatureAccess",
    section: "Admin",
    details: `Updated Design Studio access: ${cleaned.join(", ")}`,
    oldValue: { roles: old?.roles },
    newValue: { roles: cleaned },
  });

  return apiResponse({ roles: cleaned });
}
