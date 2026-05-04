import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

// INTERN < EMPLOYEE < MANAGER < ADMIN = CEO = CMO = CTO
export const ROLE_LEVEL: Record<Role, number> = {
  INTERN:   0,
  EMPLOYEE: 1,
  MANAGER:  2,
  ADMIN:    3,
  CEO:      3,
  CMO:      3,
  CTO:      3,
};

// Roles that share executive/admin privileges (max 1 of each)
export const EXECUTIVE_ROLES: Role[] = ["CEO", "CMO", "CTO"];
export const ADMIN_ROLES: Role[] = ["ADMIN", "CEO", "CMO", "CTO"];

export const DEPARTMENTS = [
  "Engineering",
  "DEV",
  "SQA",
  "Product",
  "Design",
  "HR",
  "Operations",
  "Marketing",
  "Finance",
  "Sales",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

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

export function canAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isExecutive(role: Role): boolean {
  return EXECUTIVE_ROLES.includes(role);
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    INTERN:   "Intern",
    EMPLOYEE: "Employee",
    MANAGER:  "Manager",
    ADMIN:    "Admin",
    CEO:      "CEO",
    CMO:      "CMO",
    CTO:      "CTO",
  };
  return labels[role];
}
