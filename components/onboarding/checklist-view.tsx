"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ListChecks, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ChecklistItem = { id: string; title: string; description?: string; done?: boolean; doneAt?: string };
type Checklist = { id: string; userId: string; items: ChecklistItem[]; completedAt: string | null };

export function OnboardingChecklistView({ userId, initial }: { userId: string; initial: Checklist | null }) {
  const [checklist, setChecklist] = useState<Checklist | null>(initial);

  if (!checklist) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <ListChecks className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium mb-1">No onboarding checklist assigned</h3>
        <p className="text-xs text-muted-foreground">An admin will assign you a checklist when ready.</p>
      </div>
    );
  }

  const items = (checklist.items as ChecklistItem[]) ?? [];
  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = checklist.completedAt || (total > 0 && completed === total);

  async function toggle(itemId: string, done: boolean) {
    try {
      const res = await fetch(`/api/onboarding/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, done }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setChecklist(json.data);
      if (json.data.completedAt) toast.success("🎉 Onboarding complete!");
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-xl font-semibold">{completed} of {total} complete</p>
          </div>
          <div className="text-3xl font-bold text-primary">{pct}%</div>
        </div>
        <Progress value={pct} />
      </div>

      {allDone && (
        <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            All onboarding tasks complete! Welcome to the team. 🎉
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30"
          >
            <Checkbox
              checked={!!item.done}
              onCheckedChange={(v) => toggle(item.id, !!v)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.done ? "line-through text-muted-foreground" : "font-medium"}`}>
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
