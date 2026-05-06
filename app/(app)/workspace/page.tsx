import {
  LayoutDashboard, Clock, CheckSquare, FileText,
  CalendarOff, Wallet, MessageSquareHeart, Ticket, ListChecks,
} from "lucide-react";
import { SectionHub } from "@/components/shared/section-hub";

const ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your personal command centre — stats, quick actions, and recent activity at a glance.",
    gradient: "gradient-brand",
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: Clock,
    description: "Clock in and out, track your daily working hours, and review your attendance history.",
    gradient: "gradient-info",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    description: "Manage your personal Kanban board — create, prioritise, and move tasks across columns.",
    gradient: "gradient-success",
  },
  {
    label: "Work Log",
    href: "/work-log",
    icon: FileText,
    description: "Log daily work entries with hours and descriptions, then submit them for manager approval.",
    gradient: "gradient-warning",
  },
  {
    label: "Leave",
    href: "/leave",
    icon: CalendarOff,
    description: "Request time off, track your leave balance, and see the status of past applications.",
    gradient: "bg-rose-500",
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Wallet,
    description: "Submit expense claims with receipts and track reimbursements through approval.",
    gradient: "bg-amber-500",
  },
  {
    label: "1:1 Meetings",
    href: "/one-on-ones",
    icon: MessageSquareHeart,
    description: "Schedule and document one-on-one meetings with your manager — agendas, notes, actions.",
    gradient: "bg-violet-500",
  },
  {
    label: "Helpdesk",
    href: "/helpdesk",
    icon: Ticket,
    description: "Raise IT, HR, or Admin support tickets and track their progress through to resolution.",
    gradient: "bg-teal-500",
  },
  {
    label: "Onboarding",
    href: "/onboarding",
    icon: ListChecks,
    description: "Complete your onboarding checklist and track your progress as a new team member.",
    gradient: "bg-sky-500",
  },
];

export default function WorkspacePage() {
  return (
    <SectionHub
      title="Workspace"
      description="Your daily toolkit — everything you need to manage your work, time, and requests."
      items={ITEMS}
    />
  );
}
