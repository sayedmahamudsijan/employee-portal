import { Calendar, FolderKanban, Users, Sparkles, Megaphone, FolderOpen, MessagesSquare, Contact } from "lucide-react";
import { SectionHub } from "@/components/shared/section-hub";

const ITEMS = [
  {
    label: "Team Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "See company events, public holidays, team leave, and 1:1 meetings all in one shared calendar.",
    gradient: "gradient-brand",
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "Collaborate on team projects, plan sprints, and track tasks tied to project milestones.",
    gradient: "gradient-info",
  },
  {
    label: "Teams",
    href: "/teams",
    icon: MessagesSquare,
    description: "Create focused group workspaces with live chat, quick statuses, and member presence tracking.",
    gradient: "gradient-success",
  },
  {
    label: "Team Directory",
    href: "/team",
    icon: Contact,
    description: "Browse all active team members, view profiles, departments, roles, and contact details.",
    gradient: "gradient-warning",
  },
  {
    label: "Kudos",
    href: "/kudos",
    icon: Sparkles,
    description: "Recognise and celebrate your colleagues' contributions with shoutouts visible to the whole team.",
    gradient: "bg-rose-500",
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: Megaphone,
    description: "Stay up to date with company news, policy updates, and important notices from leadership.",
    gradient: "bg-orange-500",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FolderOpen,
    description: "Access shared company documents, HR policies, onboarding resources, and team guides.",
    gradient: "bg-teal-500",
  },
];

export default function CompanyPage() {
  return (
    <SectionHub
      title="Company"
      description="Stay connected — collaborate with your team, celebrate wins, and keep up with company news."
      items={ITEMS}
    />
  );
}
