"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROLE_LEVEL, getRoleLabel, isAdmin } from "@/lib/roles";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard, CheckSquare, Clock, CalendarOff, Users, Megaphone,
  FolderOpen, Target, Star, BarChart2, Bell, Settings, Building2, ClipboardList,
  Sparkles, ListChecks, ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: Role;
  adminOnly?: boolean;
  section?: string;
}

const NAV: NavItem[] = [
  // Personal
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard, section: "Workspace" },
  { label: "Tasks",         href: "/tasks",           icon: CheckSquare,    section: "Workspace" },
  { label: "Work Log",      href: "/work-log",        icon: Clock,          section: "Workspace" },
  { label: "Leave",         href: "/leave",           icon: CalendarOff,    section: "Workspace" },
  { label: "Goals",         href: "/goals",           icon: Target,         section: "Workspace" },
  { label: "Onboarding",    href: "/onboarding",      icon: ListChecks,     section: "Workspace" },

  // Team / company
  { label: "Team",          href: "/team",            icon: Users,          section: "Company" },
  { label: "Kudos",         href: "/kudos",           icon: Sparkles,       section: "Company" },
  { label: "Announcements", href: "/announcements",   icon: Megaphone,      section: "Company" },
  { label: "Documents",     href: "/documents",       icon: FolderOpen,     section: "Company" },
  { label: "Performance",   href: "/performance",     icon: Star,           section: "Company" },

  // Manager+
  { label: "Team Logs",     href: "/work-log/admin",  icon: ClipboardList, adminOnly: true, section: "Manage" },
  { label: "Analytics",     href: "/analytics",       icon: BarChart2, minRole: "MANAGER", section: "Manage" },

  // Admin
  { label: "Admin Hub",     href: "/admin",           icon: ShieldCheck, adminOnly: true, section: "Admin" },

  // Always last
  { label: "Notifications", href: "/notifications",   icon: Bell,         section: "Account" },
  { label: "Settings",      href: "/settings",        icon: Settings,     section: "Account" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
}

export function Sidebar({ open, role }: Props) {
  const pathname = usePathname();
  const userIsAdmin = isAdmin(role);

  const visible = NAV.filter((item) => {
    if (item.adminOnly) return userIsAdmin;
    if (!item.minRole) return true;
    return ROLE_LEVEL[role] >= ROLE_LEVEL[item.minRole];
  });

  // Group by section
  const sections = visible.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section ?? "Other";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
  const sectionOrder = ["Workspace", "Company", "Manage", "Admin", "Account"];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col flex-shrink-0 h-full border-r border-border bg-sidebar transition-all duration-200",
        open ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-border gap-2 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        {open && (
          <span className="font-semibold text-sidebar-foreground text-sm truncate">MBD Portal</span>
        )}
      </div>

      {/* Nav links grouped */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {sectionOrder.map((sectionName) => {
          const items = sections[sectionName];
          if (!items || items.length === 0) return null;
          return (
            <div key={sectionName} className="mb-3">
              {open && (
                <p className="px-3 mb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {sectionName}
                </p>
              )}
              <ul className="flex flex-col gap-0.5 px-2">
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/work-log" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                        title={!open ? item.label : undefined}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {open && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
