"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type Stats = {
  total: number;
  gender: Record<string, number>;
  ethnicity: Record<string, number>;
  department: Record<string, number>;
  role: Record<string, number>;
  location: Record<string, number>;
  tenure: Record<string, number>;
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#ef4444"];

function StackedBar({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-2">
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {entries.map(([k, v], i) => (
          <div
            key={k}
            style={{ width: `${(v / Math.max(1, total)) * 100}%`, background: COLORS[i % COLORS.length] }}
            title={`${k}: ${v} (${((v / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <div className="space-y-1">
        {entries.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span>{k}</span>
            </div>
            <span className="text-muted-foreground tabular-nums">{v} · {((v / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiversityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/diversity")
      .then((r) => r.json())
      .then((j) => setStats(j.data))
      .catch(() => {});
  }, []);

  if (!stats) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const sections: { title: string; key: keyof Stats; subtitle?: string }[] = [
    { title: "Gender", key: "gender", subtitle: "Self-identified, voluntary" },
    { title: "Ethnicity", key: "ethnicity", subtitle: "Self-identified, voluntary" },
    { title: "Role Distribution", key: "role" },
    { title: "Department", key: "department" },
    { title: "Location", key: "location" },
    { title: "Tenure", key: "tenure" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-brand-soft border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Active Employees</p>
            <p className="text-3xl font-bold gradient-text">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
            {s.subtitle && <p className="text-xs text-muted-foreground mb-3">{s.subtitle}</p>}
            <StackedBar data={stats[s.key] as Record<string, number>} total={stats.total} />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground italic">
        Note: All employee self-identification fields are voluntary. Data is shown as aggregate counts only and never includes personally identifiable information.
      </p>
    </div>
  );
}
