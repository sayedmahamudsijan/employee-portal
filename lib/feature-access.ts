import type { Role } from "@prisma/client";

export const FEATURES = [
  { key: "dashboard",     label: "Dashboard" },
  { key: "tasks",         label: "Tasks" },
  { key: "work_log",      label: "Work Log" },
  { key: "leave",         label: "Leave Management" },
  { key: "announcements", label: "Announcements" },
  { key: "goals",         label: "Goals" },
  { key: "performance",   label: "Performance Reviews" },
  { key: "analytics",     label: "Analytics" },
  { key: "documents",     label: "Documents" },
  { key: "team",          label: "Team Directory" },
  { key: "notifications", label: "Notifications" },
  { key: "settings",      label: "Settings" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

// Default roles that can access each feature
export const DEFAULT_FEATURE_ACCESS: Record<FeatureKey, Role[]> = {
  dashboard:     ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  tasks:         ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  work_log:      ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  leave:         ["EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  announcements: ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  goals:         ["EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  performance:   ["EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  analytics:     ["MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  documents:     ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  team:          ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  notifications: ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"],
  settings:      ["ADMIN", "CEO", "CMO", "CTO"],
};
