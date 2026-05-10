/**
 * Portal Design — types, defaults, and helpers for the Design Studio feature.
 *
 * The full design config is stored as a single JSON blob (`designConfig`) on the
 * CompanySettings singleton row.  All fields are optional — defaults are applied at
 * render time so the portal always looks correct even before any customisation.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface DesignSection {
  label?:    string; // custom section header label
  iconName?: string; // key in DESIGN_ICON_NAMES (Lucide icon name)
}

export interface DesignConfig {
  // Brand
  portalTitle?:  string; // shown in sidebar + browser tab
  logoUrl?:      string; // base64 data URL or absolute URL
  faviconUrl?:   string; // base64 data URL or absolute URL (32×32 recommended)
  primaryColor?: string; // CSS hex, e.g. "#3b82f6"

  // Navigation — section header overrides (keyed by section key, e.g. "Workspace")
  sections?: Record<string, DesignSection>;

  // Navigation — nav item label overrides (keyed by href, e.g. "/tasks")
  navItems?: Record<string, string>;
}

// ── Parse helper ───────────────────────────────────────────────────────────

/** Safely cast a raw Prisma JsonValue to DesignConfig (never throws). */
export function parseDesignConfig(raw: unknown): DesignConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as DesignConfig;
}

// ── Section defaults (mirrors SECTION_META in sidebar.tsx) ─────────────────

export const SECTION_DEFAULTS: Record<string, { label: string; defaultIconName: string }> = {
  Workspace: { label: "Workspace", defaultIconName: "Layers" },
  Growth:    { label: "Growth",    defaultIconName: "Sprout" },
  Company:   { label: "Company",   defaultIconName: "Globe" },
  Manage:    { label: "Manage",    defaultIconName: "Briefcase" },
  Admin:     { label: "Admin",     defaultIconName: "ShieldCheck" },
  History:   { label: "History",   defaultIconName: "History" },
  Account:   { label: "Account",   defaultIconName: "UserCircle2" },
};

// ── Nav item defaults (mirrors NAV in sidebar.tsx) ─────────────────────────

export const NAV_DEFAULTS: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/attendance":       "Attendance",
  "/tasks":            "Tasks",
  "/work-log":         "Work Log",
  "/leave":            "Leave",
  "/expenses":         "Expenses",
  "/one-on-ones":      "1:1 Meetings",
  "/helpdesk":         "Helpdesk",
  "/onboarding":       "Onboarding",
  "/goals":            "Goals",
  "/okrs":             "OKRs",
  "/career":           "Career Path",
  "/mentorship":       "Mentorship",
  "/performance":      "Performance",
  "/calendar":         "Team Calendar",
  "/projects":         "Projects",
  "/teams":            "Teams",
  "/team":             "Team Directory",
  "/kudos":            "Kudos",
  "/announcements":    "Announcements",
  "/documents":        "Documents",
  "/work-log/admin":   "Team Logs",
  "/analytics":        "Analytics",
  "/admin":            "Admin Hub",
  "/admin/diversity":  "Diversity",
  "/admin/compensation": "Compensation",
  "/history/workspace": "Workspace History",
  "/history/growth":    "Growth History",
  "/history/company":   "Company History",
  "/history/manage":    "Manage History",
  "/history/admin":     "Admin History",
  "/history/account":   "Account History",
  "/notifications":    "Notifications",
  "/settings":         "Settings",
  "/design":           "Portal Design",
};

// ── Curated icon list for the icon picker ──────────────────────────────────
// These are Lucide icon NAMES (strings). The actual components are resolved
// in components/design/icon-map.tsx to keep this file server/client agnostic.

export const DESIGN_ICON_NAMES = [
  "Layers", "Sprout", "Globe", "Briefcase", "ShieldCheck", "UserCircle2",
  "History", "Building2", "Zap", "Compass", "LayoutGrid", "Rocket",
  "BookOpen", "Star", "Heart", "Flame", "Award", "Crown", "Target",
  "TrendingUp", "Users", "Settings", "Bell", "Palette", "Coffee",
  "Diamond", "Headphones", "Laptop", "Map", "Package", "Boxes",
  "FolderOpen", "BarChart2", "PieChart", "Lock", "Megaphone",
] as const;

export type DesignIconName = (typeof DESIGN_ICON_NAMES)[number];
