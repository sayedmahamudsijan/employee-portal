/**
 * Portal Design — types, defaults, and helpers for the Design Studio feature.
 *
 * The full design config is stored as a single JSON blob (`designConfig`) on the
 * CompanySettings singleton row. All fields are optional — defaults are applied at
 * render time so the portal always looks correct even before any customisation.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface DesignSection {
  label?:    string; // custom section header label
  iconName?: string; // key in DESIGN_ICON_NAMES (Lucide icon name)
}

export interface CustomNavItem {
  id:       string;  // unique key (Date.now string at creation time)
  label:    string;  // display text in sidebar
  url:      string;  // internal path OR external https:// URL
  iconName?: string; // key in DESIGN_ICON_NAMES; defaults to Globe
  section:  string;  // which sidebar section to place it under
}

export interface DesignConfig {
  // ── Brand ────────────────────────────────────────────────────────────────
  portalTitle?:  string; // shown in sidebar + browser tab
  logoUrl?:      string; // base64 data URL or absolute URL
  faviconUrl?:   string; // base64 data URL or absolute URL (32×32 recommended)
  primaryColor?: string; // CSS hex, e.g. "#3b82f6"

  // ── Navigation — section header overrides (keyed by section key) ─────────
  sections?: Record<string, DesignSection>;

  // ── Navigation — nav item label overrides (keyed by href) ────────────────
  navItems?: Record<string, string>;

  // ── Navigation — hidden sections (array of section keys) ─────────────────
  hiddenSections?: string[];

  // ── Navigation — custom section ordering (array of section keys) ─────────
  sectionOrder?: string[];

  // ── Navigation — hidden individual nav items (array of hrefs) ────────────
  hiddenNavItems?: string[];

  // ── Navigation — custom external or internal link items ──────────────────
  customNavItems?: CustomNavItem[];

  // ── Role display label overrides (keyed by role enum, e.g. "ADMIN") ──────
  roleLabels?: Record<string, string>;
}

// ── Parse helper ───────────────────────────────────────────────────────────

/** Safely cast a raw Prisma JsonValue to DesignConfig (never throws). */
export function parseDesignConfig(raw: unknown): DesignConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as DesignConfig;
}

// ── Section defaults (mirrors SECTION_META in sidebar.tsx) ─────────────────
// Does NOT include "Design" — that section cannot be hidden (circular problem).

export const SECTION_DEFAULTS: Record<string, { label: string; defaultIconName: string }> = {
  Workspace: { label: "Workspace", defaultIconName: "Layers" },
  Growth:    { label: "Growth",    defaultIconName: "Sprout" },
  Company:   { label: "Company",   defaultIconName: "Globe" },
  Manage:    { label: "Manage",    defaultIconName: "Briefcase" },
  Admin:     { label: "Admin",     defaultIconName: "ShieldCheck" },
  History:   { label: "History",   defaultIconName: "History" },
  Account:   { label: "Account",   defaultIconName: "UserCircle2" },
};

export const DEFAULT_SECTION_ORDER = Object.keys(SECTION_DEFAULTS);

// ── Nav-section map (mirrors NAV array in sidebar.tsx) ─────────────────────
// Single source of truth so both sidebar and Design Studio agree on which
// nav items belong to which section.

export const NAV_SECTION_MAP: Record<string, string> = {
  "/dashboard":             "Workspace",
  "/attendance":            "Workspace",
  "/tasks":                 "Workspace",
  "/work-log":              "Workspace",
  "/leave":                 "Workspace",
  "/expenses":              "Workspace",
  "/one-on-ones":           "Workspace",
  "/helpdesk":              "Workspace",
  "/onboarding":            "Workspace",
  "/goals":                 "Growth",
  "/okrs":                  "Growth",
  "/career":                "Growth",
  "/mentorship":            "Growth",
  "/performance":           "Growth",
  "/calendar":              "Company",
  "/projects":              "Company",
  "/teams":                 "Company",
  "/team":                  "Company",
  "/kudos":                 "Company",
  "/announcements":         "Company",
  "/documents":             "Company",
  "/work-log/admin":        "Manage",
  "/analytics":             "Manage",
  "/admin":                 "Admin",
  "/admin/diversity":       "Admin",
  "/admin/compensation":    "Admin",
  "/history/workspace":     "History",
  "/history/growth":        "History",
  "/history/company":       "History",
  "/history/manage":        "History",
  "/history/admin":         "History",
  "/history/account":       "History",
  "/notifications":         "Account",
  "/settings":              "Account",
  "/design":                "Design",
};

// ── Nav item defaults (mirrors NAV in sidebar.tsx) ─────────────────────────

export const NAV_DEFAULTS: Record<string, string> = {
  "/dashboard":           "Dashboard",
  "/attendance":          "Attendance",
  "/tasks":               "Tasks",
  "/work-log":            "Work Log",
  "/leave":               "Leave",
  "/expenses":            "Expenses",
  "/one-on-ones":         "1:1 Meetings",
  "/helpdesk":            "Helpdesk",
  "/onboarding":          "Onboarding",
  "/goals":               "Goals",
  "/okrs":                "OKRs",
  "/career":              "Career Path",
  "/mentorship":          "Mentorship",
  "/performance":         "Performance",
  "/calendar":            "Team Calendar",
  "/projects":            "Projects",
  "/teams":               "Teams",
  "/team":                "Team Directory",
  "/kudos":               "Kudos",
  "/announcements":       "Announcements",
  "/documents":           "Documents",
  "/work-log/admin":      "Team Logs",
  "/analytics":           "Analytics",
  "/admin":               "Admin Hub",
  "/admin/diversity":     "Diversity",
  "/admin/compensation":  "Compensation",
  "/history/workspace":   "Workspace History",
  "/history/growth":      "Growth History",
  "/history/company":     "Company History",
  "/history/manage":      "Manage History",
  "/history/admin":       "Admin History",
  "/history/account":     "Account History",
  "/notifications":       "Notifications",
  "/settings":            "Settings",
  "/design":              "Portal Design",
};

// ── Default role display labels ────────────────────────────────────────────

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  CEO:      "CEO",
  CMO:      "CMO",
  CTO:      "CTO",
  ADMIN:    "Admin",
  MANAGER:  "Manager",
  EMPLOYEE: "Employee",
  INTERN:   "Intern",
};

// ── Curated icon list for the icon picker ──────────────────────────────────

export const DESIGN_ICON_NAMES = [
  "Layers", "Sprout", "Globe", "Briefcase", "ShieldCheck", "UserCircle2",
  "History", "Building2", "Zap", "Compass", "LayoutGrid", "Rocket",
  "BookOpen", "Star", "Heart", "Flame", "Award", "Crown", "Target",
  "TrendingUp", "Users", "Settings", "Bell", "Palette", "Coffee",
  "Diamond", "Headphones", "Laptop", "Map", "Package", "Boxes",
  "FolderOpen", "BarChart2", "PieChart", "Lock", "Megaphone", "Link2",
  "ExternalLink", "Tag", "Hash", "FileText", "Calendar", "ChevronRight",
] as const;

export type DesignIconName = (typeof DESIGN_ICON_NAMES)[number];
