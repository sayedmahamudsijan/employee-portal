import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isManager } from "@/lib/roles";
import { ClipboardList, BarChart2 } from "lucide-react";
import { SectionHub } from "@/components/shared/section-hub";

const ITEMS = [
  {
    label: "Team Logs",
    href: "/work-log/admin",
    icon: ClipboardList,
    description: "View, filter, and export all team work logs. Approve or reject submitted entries.",
    gradient: "gradient-brand",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart2,
    description: "Team-wide metrics — attendance rates, leave overview, task completion, and expense summaries.",
    gradient: "gradient-info",
  },
];

export default async function ManagePage() {
  const session = await getServerSession(authOptions);
  if (!session || !isManager(session.user.role)) redirect("/dashboard");

  return (
    <SectionHub
      title="Manage"
      description="Lead with data — team logs, approvals, and analytics for managers and above."
      items={ITEMS}
    />
  );
}
