"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROLE_LEVEL, getRoleLabel, isAdmin } from "@/lib/roles";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard, CheckSquare, Clock, CalendarOff, Users, Megaphone,
  FolderOpen, Target, Star, BarChart2, Bell, Settings, Building2, ClipboardList,
  Sparkles, ListChecks, ShieldCheck, FolderKanban, Wallet, Calendar as CalIcon,
  MessageSquareHeart, Ticket as TicketIcon, GraduationCap, TrendingUp, Lock, PieChart,
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
  // Workspace (personal daily-use)
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard, section: "Workspace" },
  { label: "Attendance",    href: "/attendance",     icon: Clock,           section: "Workspace" },
  { label: "Tasks",         href: "/tasks",           icon: CheckSquare,    section: "Workspace" },
  { label: "Work Log",      href: "/work-log",        icon: Clock,          section: "Workspace" },
  { label: "Leave",         href: "/leave",           icon: CalendarOff,    section: "Workspace" },
  { label: "Expenses",      href: "/expenses",        icon: Wallet,         section: "Workspace" },
  { label: "1:1 Meetings",  href: "/one-on-ones",     icon: MessageSquareHeart, section: "Workspace" },
  { label: "Helpdesk",      href: "/helpdesk",        icon: TicketIcon,     section: "Workspace" },
  { label: "Onboarding",    href: "/onboarding",      icon: ListChecks,     section: "Workspace" },

  // Growth (personal development)
  { label: "Goals",         href: "/goals",           icon: Target,         section: "Growth" },
  { label: "OKRs",          href: "/okrs",            icon: Sparkles,       section: "Growth" },
  { label: "Career Path",   href: "/career",          icon: TrendingUp,     section: "Growth" },
  { label: "Mentorship",    href: "/mentorship",      icon: GraduationCap,  section: "Growth" },
  { label: "Performance",   href: "/performance",     icon: Star,           section: "Growth" },

  // Company / collaborative
  { label: "Team Calendar", href: "/calendar",        icon: CalIcon,        section: "Company" },
  { label: "Projects",      href: "/projects",        icon: FolderKanban,   section: "Company" },
  { label: "Team",          href: "/team",            icon: Users,          section: "Company" },
  { label: "Kudos",         href: "/kudos",           icon: Sparkles,       section: "Company" },
  { label: "Announcements", href: "/announcements",   icon: Megaphone,      section: "Company" },
  { label: "Documents",     href: "/documents",       icon: FolderOpen,     section: "Company" },

  // Manager+
  { label: "Team Logs",     href: "/work-log/admin",  icon: ClipboardList, adminOnly: true, section: "Manage" },
  { label: "Analytics",     href: "/analytics",       icon: BarChart2, minRole: "MANAGER", section: "Manage" },

  // Admin
  { label: "Admin Hub",     href: "/admin",           icon: ShieldCheck, adminOnly: true, section: "Admin" },
  { label: "Diversity",     href: "/admin/diversity", icon: PieChart,    adminOnly: true, section: "Admin" },
  { label: "Compensation",  href: "/admin/compensation", icon: Lock,     adminOnly: true, section: "Admin" },

  // Account
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
  const sectionOrder = ["Workspace", "Growth", "Company", "Manage", "Admin", "Account"];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col flex-shrink-0 h-full border-r border-border bg-sidebar transition-all duration-200",
        open ? "w-56" : "w-14"
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
                            ? "gradient-brand-soft text-foreground border border-primary/20"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                        title={!open ? item.label : undefined}
                      >
                        <item.icon className={cn("w-4 h-4 flex-shrink-0", active && "text-primary")} />
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
