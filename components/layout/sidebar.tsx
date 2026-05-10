"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLE_LEVEL, isAdmin } from "@/lib/roles";
import { DEFAULT_ROLE_LABELS } from "@/lib/portal-design";
import type { Role } from "@prisma/client";
import type { DesignConfig } from "@/lib/portal-design";
import { DESIGN_ICON_MAP } from "@/components/design/icon-map";
import {
  LayoutDashboard, CheckSquare, Clock, CalendarOff, Users, Megaphone,
  FolderOpen, Target, Star, BarChart2, Bell, Settings, Building2, ClipboardList,
  Sparkles, ListChecks, ShieldCheck, FolderKanban, Wallet, Calendar as CalIcon,
  MessageSquareHeart, Ticket as TicketIcon, GraduationCap, TrendingUp, Lock, PieChart,
  ChevronDown, Layers, Sprout, Globe, Briefcase, UserCircle2, MessagesSquare, Contact,
  History, Palette, ExternalLink,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label:      string;
  href:       string;
  icon:       React.ElementType;
  minRole?:   Role;
  adminOnly?: boolean;
  section:    string;
}

interface SectionMeta {
  key:        string;
  label:      string;
  icon:       React.ElementType;
  href:       string;
  minRole?:   Role;
  adminOnly?: boolean;
  featureKey?: string;
}

// ── Section definitions ──────────────────────────────────────────────────────

const SECTION_META: SectionMeta[] = [
  { key: "Workspace", label: "Workspace", icon: Layers,      href: "/workspace" },
  { key: "Growth",    label: "Growth",    icon: Sprout,      href: "/growth" },
  { key: "Company",   label: "Company",   icon: Globe,       href: "/company" },
  { key: "Manage",    label: "Manage",    icon: Briefcase,   href: "/manage", minRole: "MANAGER" },
  { key: "Admin",     label: "Admin",     icon: ShieldCheck, href: "/admin", adminOnly: true },
  { key: "Design",    label: "Design",    icon: Palette,     href: "/design", featureKey: "design" },
  { key: "History",   label: "History",   icon: History,     href: "/history", featureKey: "history" },
  { key: "Account",   label: "Account",   icon: UserCircle2, href: "/settings" },
];

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  // Workspace
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard,    section: "Workspace" },
  { label: "Attendance",    href: "/attendance",     icon: Clock,              section: "Workspace" },
  { label: "Tasks",         href: "/tasks",          icon: CheckSquare,        section: "Workspace" },
  { label: "Work Log",      href: "/work-log",       icon: Clock,              section: "Workspace" },
  { label: "Leave",         href: "/leave",          icon: CalendarOff,        section: "Workspace" },
  { label: "Expenses",      href: "/expenses",       icon: Wallet,             section: "Workspace" },
  { label: "1:1 Meetings",  href: "/one-on-ones",    icon: MessageSquareHeart, section: "Workspace" },
  { label: "Helpdesk",      href: "/helpdesk",       icon: TicketIcon,         section: "Workspace" },
  { label: "Onboarding",    href: "/onboarding",     icon: ListChecks,         section: "Workspace" },

  // Growth
  { label: "Goals",         href: "/goals",          icon: Target,             section: "Growth" },
  { label: "OKRs",          href: "/okrs",           icon: Sparkles,           section: "Growth" },
  { label: "Career Path",   href: "/career",         icon: TrendingUp,         section: "Growth" },
  { label: "Mentorship",    href: "/mentorship",     icon: GraduationCap,      section: "Growth" },
  { label: "Performance",   href: "/performance",    icon: Star,               section: "Growth" },

  // Company
  { label: "Team Calendar", href: "/calendar",       icon: CalIcon,            section: "Company" },
  { label: "Projects",      href: "/projects",       icon: FolderKanban,       section: "Company" },
  { label: "Teams",         href: "/teams",          icon: MessagesSquare,     section: "Company" },
  { label: "Team Directory",href: "/team",           icon: Contact,            section: "Company" },
  { label: "Kudos",         href: "/kudos",          icon: Sparkles,           section: "Company" },
  { label: "Announcements", href: "/announcements",  icon: Megaphone,          section: "Company" },
  { label: "Documents",     href: "/documents",      icon: FolderOpen,         section: "Company" },

  // Manage
  { label: "Team Logs",     href: "/work-log/admin", icon: ClipboardList,      section: "Manage", minRole: "MANAGER" },
  { label: "Analytics",     href: "/analytics",      icon: BarChart2,          section: "Manage", minRole: "MANAGER" },

  // Admin
  { label: "Admin Hub",     href: "/admin",          icon: ShieldCheck,        section: "Admin", adminOnly: true },
  { label: "Diversity",     href: "/admin/diversity",icon: PieChart,           section: "Admin", adminOnly: true },
  { label: "Compensation",  href: "/admin/compensation", icon: Lock,           section: "Admin", adminOnly: true },

  // Design
  { label: "Portal Design", href: "/design",         icon: Palette,            section: "Design" },

  // History
  { label: "Workspace History", href: "/history/workspace", icon: Layers,      section: "History" },
  { label: "Growth History",    href: "/history/growth",    icon: Sprout,      section: "History" },
  { label: "Company History",   href: "/history/company",   icon: Globe,       section: "History" },
  { label: "Manage History",    href: "/history/manage",    icon: Briefcase,   section: "History" },
  { label: "Admin History",     href: "/history/admin",     icon: ShieldCheck, section: "History" },
  { label: "Account History",   href: "/history/account",   icon: UserCircle2, section: "History" },

  // Account
  { label: "Notifications", href: "/notifications",  icon: Bell,               section: "Account" },
  { label: "Settings",      href: "/settings",       icon: Settings,           section: "Account" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionIsVisible(
  meta: SectionMeta, role: Role, userIsAdmin: boolean, features: string[]
): boolean {
  if (meta.featureKey) return features.includes(meta.featureKey);
  if (meta.adminOnly)  return userIsAdmin;
  if (meta.minRole)    return ROLE_LEVEL[role] >= ROLE_LEVEL[meta.minRole];
  return true;
}

function itemIsVisible(item: NavItem, role: Role, userIsAdmin: boolean): boolean {
  if (item.adminOnly) return userIsAdmin;
  if (item.minRole)   return ROLE_LEVEL[role] >= ROLE_LEVEL[item.minRole];
  return true;
}

/** Resolve a stored icon name to a Lucide component, with fallback. */
function resolveIcon(iconName: string | undefined, fallback: React.ElementType): React.ElementType {
  if (!iconName) return fallback;
  return DESIGN_ICON_MAP[iconName] ?? fallback;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open:          boolean;
  onClose:       () => void;
  role:          Role;
  features?:     string[];
  designConfig?: DesignConfig;
}

export function Sidebar({ open, role, features = [], designConfig = {} }: Props) {
  const pathname    = usePathname();
  const userIsAdmin = isAdmin(role);

  const {
    portalTitle,
    logoUrl,
    sections:       sectionOverrides = {},
    navItems:       navOverrides     = {},
    hiddenSections  = [],
    sectionOrder    = [],
    hiddenNavItems  = [],
    customNavItems  = [],
    roleLabels      = {},
  } = designConfig;

  // ── Apply sectionOrder sort ──────────────────────────────────────────────
  // "Design" is not in sectionOrder so it stays at its natural SECTION_META
  // position (sorts last among un-ordered sections).
  const sortedSectionMeta = [...SECTION_META].sort((a, b) => {
    const ai = sectionOrder.indexOf(a.key);
    const bi = sectionOrder.indexOf(b.key);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // Determine which section the current route lives in
  const activeSection = (() => {
    for (const item of NAV) {
      const match =
        item.href === pathname ||
        (item.href !== "/work-log" && pathname.startsWith(item.href + "/"));
      if (match) return item.section;
    }
    for (const s of SECTION_META) {
      if (pathname === s.href || pathname.startsWith(s.href + "/")) return s.key;
    }
    return "Workspace";
  })();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  function toggleSection(key: string) {
    setExpandedSection((prev) => (prev === key ? null : key));
  }

  // Role display label — custom if set, otherwise system default
  const roleDisplayLabel =
    roleLabels[role] ?? DEFAULT_ROLE_LABELS[role] ?? role;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col flex-shrink-0 h-full border-r border-border bg-sidebar transition-all duration-200",
        open ? "w-60" : "w-14"
      )}
    >
      {/* ── Logo / portal identity ──────────────────────────────────────────── */}
      <div className="flex items-center h-14 px-3 border-b border-border gap-2 flex-shrink-0 overflow-hidden">
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt={portalTitle ?? "Portal logo"}
              className={cn(
                "object-contain flex-shrink-0",
                open ? "h-8 max-w-[140px]" : "h-8 w-8 rounded"
              )}
            />
            {open && (
              <span className="font-bold text-sm truncate gradient-text">
                {portalTitle ?? "MBD Portal"}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-brand text-white flex-shrink-0 glow-primary">
              <Building2 className="w-4 h-4" />
            </div>
            {open && (
              <span className="font-bold text-sm truncate gradient-text">
                {portalTitle ?? "MBD Portal"}
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {sortedSectionMeta
          .filter((s) => {
            // Role/feature visibility check
            if (!sectionIsVisible(s, role, userIsAdmin, features)) return false;
            // Design-Studio hide toggle (never hides the Design section itself)
            if (s.key !== "Design" && hiddenSections.includes(s.key)) return false;
            return true;
          })
          .map((sectionMeta) => {
            const builtInItems = NAV.filter(
              (item) =>
                item.section === sectionMeta.key &&
                itemIsVisible(item, role, userIsAdmin) &&
                !hiddenNavItems.includes(item.href)
            );
            const customItems = customNavItems.filter(
              (ci) => ci.section === sectionMeta.key
            );

            if (builtInItems.length === 0 && customItems.length === 0) return null;

            const isExpanded   = expandedSection === sectionMeta.key;
            const override     = sectionOverrides[sectionMeta.key] ?? {};
            const sectionLabel = override.label ?? sectionMeta.label;
            const SectionIcon  = resolveIcon(override.iconName, sectionMeta.icon);

            const sectionActive =
              pathname === sectionMeta.href ||
              builtInItems.some(
                (i) =>
                  i.href === pathname ||
                  (i.href !== "/work-log" && pathname.startsWith(i.href + "/"))
              ) ||
              customItems.some((ci) => !ci.url.startsWith("http") && pathname === ci.url);

            return (
              <div key={sectionMeta.key} className="mb-1">
                {/* ── Section header ─────────────────────────────────────────── */}
                {open ? (
                  <div
                    className={cn(
                      "flex items-center mx-2 mb-0.5 rounded-md transition-colors group",
                      sectionActive ? "bg-primary/8" : "hover:bg-sidebar-accent/30"
                    )}
                  >
                    <Link
                      href={sectionMeta.href}
                      className="flex items-center gap-2 flex-1 px-2 py-1.5 min-w-0"
                    >
                      <SectionIcon
                        className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          sectionActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs uppercase tracking-wider font-bold truncate",
                          sectionActive ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {sectionLabel}
                      </span>
                    </Link>
                    <button
                      onClick={() => toggleSection(sectionMeta.key)}
                      className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-150",
                          !isExpanded && "-rotate-90"
                        )}
                      />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={sectionMeta.href}
                    title={sectionLabel}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 mx-auto rounded-lg mb-0.5 transition-colors",
                      sectionActive
                        ? "gradient-brand-soft text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <SectionIcon className="w-4 h-4" />
                  </Link>
                )}

                {/* ── Nav items ──────────────────────────────────────────────── */}
                {(isExpanded || !open) && (
                  <ul className={cn("flex flex-col gap-0.5", open ? "px-2" : "px-1.5")}>
                    {/* Built-in items */}
                    {(() => {
                      const exactMatchExists = builtInItems.some((i) => i.href === pathname);
                      return builtInItems.map((item) => {
                        const active =
                          pathname === item.href ||
                          (!exactMatchExists &&
                            item.href !== "/work-log" &&
                            pathname.startsWith(item.href + "/"));
                        const itemLabel = navOverrides[item.href] ?? item.label;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              title={!open ? itemLabel : undefined}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
                                open ? "px-2 py-1.5" : "justify-center w-9 h-9 mx-auto",
                                active
                                  ? "gradient-brand-soft text-foreground border border-primary/20"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <item.icon
                                className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")}
                              />
                              {open && <span className="truncate">{itemLabel}</span>}
                            </Link>
                          </li>
                        );
                      });
                    })()}

                    {/* Custom link items */}
                    {customItems.map((ci) => {
                      const CiIcon    = ci.iconName ? (DESIGN_ICON_MAP[ci.iconName] ?? Globe) : Globe;
                      const isExternal = ci.url.startsWith("http");
                      const isActive   = !isExternal && pathname === ci.url;

                      return (
                        <li key={ci.id}>
                          {isExternal ? (
                            <a
                              href={ci.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={!open ? ci.label : undefined}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
                                open ? "px-2 py-1.5" : "justify-center w-9 h-9 mx-auto",
                                "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <CiIcon className="w-4 h-4 flex-shrink-0" />
                              {open && (
                                <>
                                  <span className="truncate flex-1">{ci.label}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40" />
                                </>
                              )}
                            </a>
                          ) : (
                            <Link
                              href={ci.url}
                              title={!open ? ci.label : undefined}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
                                open ? "px-2 py-1.5" : "justify-center w-9 h-9 mx-auto",
                                isActive
                                  ? "gradient-brand-soft text-foreground border border-primary/20"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <CiIcon
                                className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")}
                              />
                              {open && <span className="truncate">{ci.label}</span>}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
      </nav>

      {/* ── Role badge ──────────────────────────────────────────────────────── */}
      {open && (
        <div className="px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{roleDisplayLabel}</span>
        </div>
      )}
    </aside>
  );
}
