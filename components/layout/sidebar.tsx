"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLE_LEVEL, getRoleLabel, isAdmin } from "@/lib/roles";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard, CheckSquare, Clock, CalendarOff, Users, Megaphone,
  FolderOpen, Target, Star, BarChart2, Bell, Settings, Building2, ClipboardList,
  Sparkles, ListChecks, ShieldCheck, FolderKanban, Wallet, Calendar as CalIcon,
  MessageSquareHeart, Ticket as TicketIcon, GraduationCap, TrendingUp, Lock, PieChart,
  ChevronDown, Layers, Sprout, Globe, Briefcase, UserCircle2, MessagesSquare, Contact,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: Role;
  adminOnly?: boolean;
  section: string;
}

interface SectionMeta {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;        // section hub page
  minRole?: Role;
  adminOnly?: boolean;
}

// ── Section definitions ──────────────────────────────────────────────────────

const SECTION_META: SectionMeta[] = [
  { key: "Workspace", label: "Workspace", icon: Layers,      href: "/workspace" },
  { key: "Growth",    label: "Growth",    icon: Sprout,      href: "/growth" },
  { key: "Company",   label: "Company",   icon: Globe,       href: "/company" },
  { key: "Manage",    label: "Manage",    icon: Briefcase,   href: "/manage", minRole: "MANAGER" },
  { key: "Admin",     label: "Admin",     icon: ShieldCheck, href: "/admin", adminOnly: true },
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

  // Account
  { label: "Notifications", href: "/notifications",  icon: Bell,               section: "Account" },
  { label: "Settings",      href: "/settings",       icon: Settings,           section: "Account" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionIsVisible(meta: SectionMeta, role: Role, userIsAdmin: boolean): boolean {
  if (meta.adminOnly) return userIsAdmin;
  if (meta.minRole)   return ROLE_LEVEL[role] >= ROLE_LEVEL[meta.minRole];
  return true;
}

function itemIsVisible(item: NavItem, role: Role, userIsAdmin: boolean): boolean {
  if (item.adminOnly) return userIsAdmin;
  if (item.minRole)   return ROLE_LEVEL[role] >= ROLE_LEVEL[item.minRole];
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
}

export function Sidebar({ open, role }: Props) {
  const pathname = usePathname();
  const userIsAdmin = isAdmin(role);

  // Determine which section the current route lives in
  const activeSection = (() => {
    for (const item of NAV) {
      const match =
        item.href === pathname ||
        (item.href !== "/work-log" && pathname.startsWith(item.href + "/"));
      if (match) return item.section;
    }
    // Also match section hub pages
    for (const s of SECTION_META) {
      if (pathname === s.href) return s.key;
    }
    return "Workspace";
  })();

  // Accordion: only one section open at a time; all collapsed by default
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  function toggleSection(key: string) {
    // If already open → collapse it (all closed); otherwise open only this one
    setExpandedSection((prev) => (prev === key ? null : key));
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col flex-shrink-0 h-full border-r border-border bg-sidebar transition-all duration-200",
        open ? "w-60" : "w-14"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-border gap-2 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-brand text-white flex-shrink-0 glow-primary">
          <Building2 className="w-4 h-4" />
        </div>
        {open && (
          <span className="font-bold text-sm truncate gradient-text">MBD Portal</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {SECTION_META.filter((s) => sectionIsVisible(s, role, userIsAdmin)).map((sectionMeta) => {
          const items = NAV.filter(
            (item) => item.section === sectionMeta.key && itemIsVisible(item, role, userIsAdmin)
          );
          if (items.length === 0) return null;

          const isExpanded  = expandedSection === sectionMeta.key;
          const SectionIcon = sectionMeta.icon;

          // Is any child active, or the section hub itself?
          const sectionActive = pathname === sectionMeta.href
            || items.some((i) =>
              i.href === pathname ||
              (i.href !== "/work-log" && pathname.startsWith(i.href + "/")));

          return (
            <div key={sectionMeta.key} className="mb-1">
              {/* ── Section header ────────────────────────────────────── */}
              {open ? (
                <div
                  className={cn(
                    "flex items-center mx-2 mb-0.5 rounded-md transition-colors group",
                    sectionActive ? "bg-primary/8" : "hover:bg-sidebar-accent/30"
                  )}
                >
                  {/* Section label → navigates to section hub */}
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
                      {sectionMeta.label}
                    </span>
                  </Link>
                  {/* Chevron → toggles subsections */}
                  <button
                    onClick={() => toggleSection(sectionMeta.key)}
                    className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <ChevronDown
                      className={cn("w-3 h-3 transition-transform duration-150", !isExpanded && "-rotate-90")}
                    />
                  </button>
                </div>
              ) : (
                /* Collapsed: show section icon as hub link */
                <Link
                  href={sectionMeta.href}
                  title={sectionMeta.label}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 mx-auto rounded-lg mb-0.5 transition-colors",
                    sectionActive ? "gradient-brand-soft text-primary" : "text-muted-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <SectionIcon className="w-4 h-4" />
                </Link>
              )}

              {/* ── Nav items ─────────────────────────────────────────── */}
              {(isExpanded || !open) && (
                <ul className={cn("flex flex-col gap-0.5", open ? "px-2" : "px-1.5")}>
                  {(() => {
                    // If any sibling has an exact pathname match, disable prefix-matching
                    // for all other items (prevents /admin from staying active on /admin/diversity)
                    const exactMatchExists = items.some(i => i.href === pathname);
                    return items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (!exactMatchExists && item.href !== "/work-log" && pathname.startsWith(item.href + "/"));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={!open ? item.label : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
                            open ? "px-2 py-1.5" : "justify-center w-9 h-9 mx-auto",
                            active
                              ? "gradient-brand-soft text-foreground border border-primary/20"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")} />
                          {open && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  });
                  })()}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Role badge */}
      {open && (
        <div className="px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{getRoleLabel(role)}</span>
        </div>
      )}
    </aside>
  );
}
