"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROLE_LEVEL, getRoleLabel, isAdmin } from "@/lib/roles";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard, CheckSquare, Clock, CalendarOff, Users, Megaphone,
  FolderOpen, Target, Star, BarChart2, Bell, Settings, Building2, ClipboardList,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: Role;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard },
  { label: "Tasks",         href: "/tasks",           icon: CheckSquare },
  { label: "Work Log",      href: "/work-log",        icon: Clock },
  { label: "Team Logs",     href: "/work-log/admin",  icon: ClipboardList, adminOnly: true },
  { label: "Leave",         href: "/leave",           icon: CalendarOff },
  { label: "Team",          href: "/team",            icon: Users },
  { label: "Announcements", href: "/announcements",   icon: Megaphone },
  { label: "Documents",     href: "/documents",       icon: FolderOpen },
  { label: "Goals",         href: "/goals",           icon: Target },
  { label: "Performance",   href: "/performance",     icon: Star },
  { label: "Analytics",     href: "/analytics",       icon: BarChart2, minRole: "MANAGER" },
  { label: "Notifications", href: "/notifications",   icon: Bell },
  { label: "Settings",      href: "/settings",        icon: Settings },
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

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="flex flex-col gap-0.5 px-2">
          {visible.map((item) => {
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
