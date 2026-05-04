"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/shared/stat-card";
import { AlertCircle, CheckSquare, TrendingUp, Users } from "lucide-react";

const COLORS = {
  primary: "oklch(0.42 0.19 264)",
  green: "oklch(0.65 0.18 140)",
  amber: "oklch(0.7 0.17 60)",
  red: "oklch(0.6 0.2 30)",
  purple: "oklch(0.6 0.2 300)",
};

const STATUS_COLORS: Record<string, string> = {
  "TO DO": "#94a3b8",
  "IN PROGRESS": COLORS.primary,
  "IN REVIEW": "#a855f7",
  "DONE": COLORS.green,
  "BLOCKED": COLORS.red,
};

interface Props {
  velocity: { name: string; completed: number; total: number }[];
  statusBreakdown: { name: string; value: number }[];
  workload: { name: string; tasks: number; logged: number; estimated: number }[];
  monthlyLeave: { month: string; CASUAL: number; SICK: number; ANNUAL: number }[];
  overdueTasks: number;
  activeSprint: { name: string } | null;
}

export function AnalyticsDashboard({ velocity, statusBreakdown, workload, monthlyLeave, overdueTasks, activeSprint }: Props) {
  const totalTasks = statusBreakdown.reduce((s, x) => s + x.value, 0);
  const doneTasks = statusBreakdown.find((x) => x.name === "DONE")?.value ?? 0;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Sprint" value={activeSprint?.name ?? "—"} icon={TrendingUp} />
        <StatCard label="Sprint Tasks" value={totalTasks} icon={CheckSquare} />
        <StatCard label="Completed" value={doneTasks} icon={CheckSquare} color="green" />
        <StatCard label="Overdue Tasks" value={overdueTasks} icon={AlertCircle} color={overdueTasks > 0 ? "red" : "default"} />
      </div>

      {/* Sprint metrics */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Sprint Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Velocity */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Velocity (tasks completed per sprint)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} name="Completed" />
                <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status donut */}
          {statusBreakdown.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Current Sprint Status — {activeSprint?.name}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusBreakdown.filter((x) => x.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? COLORS.primary}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Team workload */}
      {workload.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-4">Team Workload</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Tasks assigned + hours (current sprint)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={workload}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill={COLORS.primary} name="Tasks" radius={[3, 3, 0, 0]} />
                <Bar dataKey="logged" fill={COLORS.green} name="Logged hrs" radius={[3, 3, 0, 0]} />
                <Bar dataKey="estimated" fill="#94a3b8" name="Estimated hrs" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Leave trends */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Leave Trends (6 months)</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyLeave}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="CASUAL" fill={COLORS.primary} name="Casual" radius={[3, 3, 0, 0]} />
              <Bar dataKey="SICK" fill={COLORS.amber} name="Sick" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ANNUAL" fill={COLORS.green} name="Annual" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
