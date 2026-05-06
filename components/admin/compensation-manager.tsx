"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Lock, Wallet } from "lucide-react";

export function CompensationManager({ users }: { users: any[] }) {
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10),
    baseSalary: "", currency: "BDT", bonusAnnual: "",
    equityShares: "", reason: "", notes: "",
  });
  const [filter, setFilter] = useState("");

  const filteredUsers = users.filter((u) =>
    !filter || u.name.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase())
  );

  async function loadHistory(userId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/compensation/${userId}`);
      const json = await res.json();
      setHistory(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (!selected || !form.baseSalary) return toast.error("Salary required");
    try {
      const res = await fetch(`/api/admin/compensation/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setHistory([json.data, ...history]);
      setShowAdd(false);
      setForm({ ...form, baseSalary: "", bonusAnnual: "", reason: "", notes: "" });
      toast.success("Recorded");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Compensation data is admin-only and never exposed to employees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4">
        {/* User list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border">
            <Input placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelected(u); loadHistory(u.id); }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 text-left ${selected?.id === u.id ? "bg-muted" : ""}`}
              >
                <Avatar name={u.name} src={u.image} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.jobTitle ?? u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-4">
          {!selected ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Select an employee to view compensation history</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Avatar name={selected.name} src={selected.image} size="md" />
                  <div>
                    <p className="font-semibold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.jobTitle ?? selected.department ?? "—"}</p>
                  </div>
                </div>
                <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Record Change
                </Button>
              </div>

              {showAdd && (
                <div className="rounded-lg border border-border p-3 mb-4 space-y-2 bg-muted/20">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Effective</label>
                      <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Base Salary (annual)</label>
                      <div className="grid grid-cols-[1fr,80px] gap-1">
                        <Input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
                        <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["BDT","USD","EUR","GBP","INR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Bonus (annual)</label>
                      <Input type="number" value={form.bonusAnnual} onChange={(e) => setForm({ ...form, bonusAnnual: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Equity (shares)</label>
                      <Input type="number" value={form.equityShares} onChange={(e) => setForm({ ...form, equityShares: e.target.value })} />
                    </div>
                  </div>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                    <SelectContent>
                      {["Initial offer", "Annual review", "Promotion", "Market adjustment", "Retention", "Other"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    <Button size="sm" onClick={add} className="gradient-brand text-white border-0">Save</Button>
                  </div>
                </div>
              )}

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No compensation history.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((c, i) => (
                    <div key={c.id} className={`rounded-lg p-3 ${i === 0 ? "card-festive" : "bg-muted/30 border border-border"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{formatDate(c.effectiveDate)} · {c.reason ?? "—"}</p>
                          <p className="font-bold text-lg tabular-nums">{c.baseSalary.toLocaleString()} {c.currency}/yr</p>
                          {(c.bonusAnnual || c.equityShares) && (
                            <p className="text-xs text-muted-foreground">
                              {c.bonusAnnual ? `Bonus: ${c.bonusAnnual.toLocaleString()}` : ""}
                              {c.bonusAnnual && c.equityShares ? " · " : ""}
                              {c.equityShares ? `Equity: ${c.equityShares.toLocaleString()} shares` : ""}
                            </p>
                          )}
                          {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                        </div>
                        {i === 0 && <span className="text-[10px] uppercase font-semibold gradient-brand text-white px-1.5 py-0.5 rounded">Current</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
