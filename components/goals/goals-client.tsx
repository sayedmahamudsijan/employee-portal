"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { GoalCard } from "@/components/goals/goal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: "IN_PROGRESS" | "COMPLETED" | "MISSED";
  dueDate: string | null;
  quarter: string;
  year: number;
};

interface Props {
  initialGoals: Goal[];
  userId: string;
  role: Role;
  defaultQuarter: string;
  defaultYear: number;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const YEARS = [2025, 2026, 2027];

export function GoalsClient({ initialGoals, userId, role, defaultQuarter, defaultYear }: Props) {
  const [goals, setGoals] = useState(initialGoals);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [year, setYear] = useState(String(defaultYear));
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", dueDate: "" });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadGoals(q: string, y: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?userId=${userId}&quarter=${q}&year=${y}`);
      const { data } = await res.json();
      setGoals(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleQuarterChange(q: string) {
    setQuarter(q);
    loadGoals(q, year);
  }
  function handleYearChange(y: string) {
    setYear(y);
    loadGoals(quarter, y);
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim()) return toast.error("Title required");
    setCreating(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, quarter, year: parseInt(year) }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setGoals((g) => [data, ...g]);
      setCreateOpen(false);
      setCreateForm({ title: "", description: "", dueDate: "" });
      toast.success("Goal created");
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setCreating(false);
    }
  }

  function handleGoalUpdated(updated: Goal) {
    setGoals((g) => g.map((x) => (x.id === updated.id ? updated : x)));
  }
  function handleGoalDeleted(id: string) {
    setGoals((g) => g.filter((x) => x.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Goals & OKRs"
        description="Set and track your quarterly objectives"
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <Select value={quarter} onValueChange={handleQuarterChange}>
          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {QUARTERS.map((q) => (
              <SelectItem key={q} value={q}>{q}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`No goals for ${quarter} ${year}`}
          description="Set your first goal for this quarter."
          action={<Button onClick={() => setCreateOpen(true)} variant="outline">Add Goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdated={handleGoalUpdated}
              onDeleted={handleGoalDeleted}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Goal — {quarter} {year}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createGoal} className="space-y-3 mt-2">
            <Input
              placeholder="Goal title *"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target date</label>
              <Input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create Goal"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
