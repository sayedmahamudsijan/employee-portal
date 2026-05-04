import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

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
  const roleOrder: Record<Role, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  const userLevel = roleOrder[session.user.role];
  const minRequired = Math.min(...roles.map((r) => roleOrder[r]));

  if (userLevel < minRequired) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { session, error: null };
}

export function canAccess(userRole: Role, requiredRole: Role): boolean {
  const roleOrder: Record<Role, number> = { EMPLOYEE: 0, MANAGER: 1, ADMIN: 2 };
  return roleOrder[userRole] >= roleOrder[requiredRole];
}
