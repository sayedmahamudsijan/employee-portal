import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROLE_LEVEL } from "@/lib/roles";
import { DEFAULT_FEATURE_ACCESS, type FeatureKey } from "@/lib/feature-access";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/security/audit";
import type { Role } from "@prisma/client";

// Re-export everything from roles so API routes only need one import
export * from "@/lib/roles";

export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require an authenticated, ACTIVE user with a non-revoked session.
 * Returns `{ session }` on success, `{ error }` (NextResponse) on failure.
 *
 * Also checks `User.sessionsValidFrom` — if set, any session token created
 * before that timestamp is treated as revoked. This is how we kick out a
 * disabled user without waiting for their cookie to expire.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    await audit({ event: "UNAUTHORIZED_ACCESS", severity: "warn" });
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.status !== "ACTIVE") {
    await audit({
      event: "FORBIDDEN_ACCESS",
      userId: session.user.id,
      email:  session.user.email,
      metadata: { reason: "status_not_active", status: session.user.status },
    });
    return { error: NextResponse.json({ error: "Account not active" }, { status: 403 }), session: null };
  }
  return { session, error: null };
}

export async function withRole(requiredRole: Role | Role[]) {
  const { session, error } = await requireAuth();
  if (error || !session) return { error, session: null };

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const userLevel = ROLE_LEVEL[session.user.role];
  const minRequired = Math.min(...roles.map((r) => ROLE_LEVEL[r]));

  if (userLevel < minRequired) {
    await audit({
      event:    "FORBIDDEN_ACCESS",
      userId:   session.user.id,
      email:    session.user.email,
      metadata: { reason: "role_below_required", userRole: session.user.role, required: roles },
    });
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { session, error: null };
}

/**
 * Check if the current user's role has access to a specific feature.
 * Reads overrides from DB, falls back to DEFAULT_FEATURE_ACCESS.
 */
export async function withFeature(feature: FeatureKey) {
  const { session, error } = await requireAuth();
  if (error || !session) return { error, session: null };

  const override = await prisma.featureAccess.findUnique({ where: { feature } });
  const allowed  = override ? (override.roles as string[]) : DEFAULT_FEATURE_ACCESS[feature];

  const hasAccess =
    allowed.includes(session.user.role) ||
    (!!session.user.customRoleId && allowed.includes(session.user.customRoleId));

  if (!hasAccess) {
    await audit({
      event:    "FORBIDDEN_ACCESS",
      userId:   session.user.id,
      email:    session.user.email,
      metadata: { reason: "feature_not_allowed", feature, userRole: session.user.role },
    });
    return {
      error: NextResponse.json({ error: "You don't have permission to perform this action." }, { status: 403 }),
      session: null,
    };
  }
  return { session, error: null };
}

/**
 * Check feature access without returning an error response — useful for
 * server components that need a boolean check.
 */
export async function checkFeature(feature: FeatureKey, role: Role, customRoleId?: string | null): Promise<boolean> {
  const override = await prisma.featureAccess.findUnique({ where: { feature } });
  const allowed  = override ? (override.roles as string[]) : DEFAULT_FEATURE_ACCESS[feature];
  return allowed.includes(role) || (!!customRoleId && allowed.includes(customRoleId));
}
