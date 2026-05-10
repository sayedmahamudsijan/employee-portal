import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FEATURE_ACCESS } from "@/lib/feature-access";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import {
  Layers, Sprout, Globe, Briefcase, ShieldCheck, UserCircle2,
} from "lucide-react";
import type { Role } from "@prisma/client";

async function canAccessHistory(role: Role) {
  const saved = await prisma.featureAccess.findUnique({ where: { feature: "history" } });
  const roles = (saved?.roles ?? DEFAULT_FEATURE_ACCESS.history) as string[];
  return roles.includes(role);
}

const SECTIONS = [
  { key: "workspace", label: "Workspace History",  icon: Layers,      description: "Work logs, tasks, leave, expenses, attendance" },
  { key: "growth",    label: "Growth History",     icon: Sprout,      description: "Goals, OKRs, performance reviews, career changes" },
  { key: "company",   label: "Company History",    icon: Globe,       description: "Announcements, kudos, teams, documents" },
  { key: "manage",    label: "Manage History",     icon: Briefcase,   description: "Work log approvals, leave approvals, task assignments" },
  { key: "admin",     label: "Admin History",      icon: ShieldCheck, description: "Role changes, status changes, access control, user removal" },
  { key: "account",   label: "Account History",    icon: UserCircle2, description: "Profile updates, settings changes" },
];

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const allowed = await canAccessHistory(session.user.role as Role);
  if (!allowed) redirect("/dashboard");

  return (
    <div>
      <PageHeader
        title="Activity History"
        description="Full audit trail of all actions taken across the portal"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ key, label, icon: Icon, description }) => (
          <Link
            key={key}
            href={`/history/${key}`}
            className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg gradient-brand-soft flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
