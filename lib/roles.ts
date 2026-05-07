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

export function canAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isManager(role: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL["MANAGER"];
}

export function isExecutive(role: Role): boolean {
  return EXECUTIVE_ROLES.includes(role);
}

/**
 * Role-assignment access control:
 *   CEO / CMO / CTO  → can assign ANY role (including other executives and ADMIN)
 *   ADMIN            → can only assign roles strictly below ADMIN level
 *                      (MANAGER, EMPLOYEE, INTERN)
 *   others           → cannot assign roles at all
 */
export function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
  if (EXECUTIVE_ROLES.includes(assignerRole)) return true;           // executives: unlimited
  if (assignerRole === "ADMIN") return ROLE_LEVEL[targetRole] < ROLE_LEVEL["ADMIN"]; // admin: below-admin only
  return false;
}

/** Returns the list of roles the given assigner is allowed to set on others. */
export function getAssignableRoles(assignerRole: Role): Role[] {
  if (EXECUTIVE_ROLES.includes(assignerRole))
    return ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"];
  if (assignerRole === "ADMIN")
    return ["INTERN", "EMPLOYEE", "MANAGER"];
  return [];
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
