import { Target, Sparkles, TrendingUp, GraduationCap, Star } from "lucide-react";
import { SectionHub } from "@/components/shared/section-hub";

const ITEMS = [
  {
    label: "Goals",
    href: "/goals",
    icon: Target,
    description: "Set personal professional goals, track progress, and mark milestones as you achieve them.",
    gradient: "gradient-brand",
  },
  {
    label: "OKRs",
    href: "/okrs",
    icon: Sparkles,
    description: "Define Objectives and Key Results tied to company strategy and measure your progress.",
    gradient: "gradient-info",
  },
  {
    label: "Career Path",
    href: "/career",
    icon: TrendingUp,
    description: "Explore career levels in your track, understand promotion requirements, and plan your next step.",
    gradient: "gradient-success",
  },
  {
    label: "Mentorship",
    href: "/mentorship",
    icon: GraduationCap,
    description: "Connect with mentors across the team or offer your expertise to help colleagues grow.",
    gradient: "gradient-warning",
  },
  {
    label: "Performance",
    href: "/performance",
    icon: Star,
    description: "View your performance reviews, ratings, and development feedback from past cycles.",
    gradient: "bg-violet-500",
  },
];

export default function GrowthPage() {
  return (
    <SectionHub
      title="Growth"
      description="Invest in yourself — tools for goal-setting, career development, mentorship, and performance."
      items={ITEMS}
    />
  );
}
