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
