"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, FolderKanban, Calendar as CalIcon, Users as UsersIcon, Wallet } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  PLANNING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:     "gradient-success text-white",
  ON_HOLD:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CANCELLED:  "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function ProjectsBoard({ initial, users, canEdit }: { initial: any[]; users: any[]; canEdit: boolean }) {
  const [projects, setProjects] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", code: "", client: "", description: "",
    status: "PLANNING", startDate: "", endDate: "",
    budget: "", currency: "BDT", leadId: "", color: "#6366f1",
  });

  async function add() {
    if (!form.name) return toast.error("Name required");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: form.budget || null, leadId: form.leadId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProjects([{ ...json.data, _count: { sprints: 0, okrs: 0 }, lead: users.find((u) => u.id === form.leadId) ?? null }, ...projects]);
      setShowAdd(false);
      setForm({ ...form, name: "", code: "", description: "", client: "" });
      toast.success("Project created");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{projects.length} project(s)</p>
        {canEdit && (
          <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
            <Plus className="w-4 h-4 mr-1.5" /> New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition">
              <div
                className="h-2"
                style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)` }}
              />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {p.code && <p className="text-xs font-mono text-muted-foreground">{p.code}</p>}
                  </div>
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[p.status]}`}>{p.status.replace("_", " ")}</span>
                </div>

                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}

                {p.client && <p className="text-xs"><span className="text-muted-foreground">Client:</span> <span className="font-medium">{p.client}</span></p>}

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {(p.startDate || p.endDate) && (
                    <div className="flex items-center gap-1.5">
                      <CalIcon className="w-3 h-3" />
                      <span>{p.startDate ? formatDate(p.startDate) : "?"} → {p.endDate ? formatDate(p.endDate) : "?"}</span>
                    </div>
                  )}
                  {p.budget && (
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3 h-3" />
                      <span>{p.budget.toLocaleString()} {p.currency}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  {p.lead ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={p.lead.name} src={p.lead.image} size="xs" />
                      <span className="text-xs text-muted-foreground truncate">{p.lead.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No lead</span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p._count.sprints} sprints</span>
                    {p._count.okrs > 0 && <span>· {p._count.okrs} OKRs</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr,140px] gap-2">
              <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <Input placeholder="Client (optional)" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start</label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End</label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-[1fr,100px] gap-2">
              <Input type="number" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["BDT", "USD", "EUR", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[1fr,80px] gap-2">
              <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                <SelectTrigger><SelectValue placeholder="Project lead" /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={add} className="gradient-brand text-white border-0">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
