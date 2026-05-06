"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle, XCircle, Wallet } from "lucide-react";

export function ExpenseApprovals() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expenses?scope=team&status=PENDING")
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED" | "PAID", reason?: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error();
      setItems(items.filter((i) => i.id !== id));
      toast.success(`Expense ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed");
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No pending expenses.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {items.map((e) => (
        <div key={e.id} className="px-4 py-3 hover:bg-muted/30 grid grid-cols-[auto,1fr,auto] gap-3 items-start">
          <Avatar name={e.user.name} src={e.user.image} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{e.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {e.category} · {formatDate(e.expenseDate)}
            </p>
            <p className="text-sm mt-1 truncate">{e.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">{e.amount.toLocaleString()} {e.currency}</span>
            <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => review(e.id, "APPROVED")}>
              <CheckCircle className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => {
              const reason = prompt("Rejection reason?");
              if (reason !== null) review(e.id, "REJECTED", reason);
            }}>
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
