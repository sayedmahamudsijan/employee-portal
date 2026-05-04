import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROLE_LEVEL } from "@/lib/roles";
import type { Role } from "@prisma/client";

// Re-export everything from roles so API routes only need one import
export * from "@/lib/roles";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.status !== "ACTIVE") {
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
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { session, error: null };
}
