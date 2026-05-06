"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Target, Trash2, Sparkles, X } from "lucide-react";

type KeyResult = { id: string; title: string; target: number; current: number; unit: string };
type OKR = {
  id: string;
  objective: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  quarter: string;
  year: number;
  keyResults: KeyResult[];
  project: { id: string; name: string; color: string } | null;
};

function calcProgress(krs: KeyResult[]) {
  if (!krs?.length) return 0;
  const sum = krs.reduce((acc, k) => acc + Math.min(100, ((k.current ?? 0) / Math.max(1, k.target)) * 100), 0);
  return Math.round(sum / krs.length);
}

export function OKRsBoard({
  initial, projects, currentQuarter, currentYear,
}: {
  initial: OKR[];
  projects: any[];
  currentQuarter: string;
  currentYear: number;
}) {
  const [okrs, setOkrs] = useState<OKR[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState<OKR | null>(null);
  const [form, setForm] = useState({
    objective: "", description: "",
    quarter: currentQuarter, year: currentYear,
    projectId: "",
    keyResults: [{ id: "kr-0", title: "", target: 100, current: 0, unit: "%" }] as KeyResult[],
  });

  async function add() {
    if (!form.objective) return toast.error("Objective required");
    if (form.keyResults.some((k) => !k.title)) return toast.error("All key results need a title");
    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId: form.projectId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOkrs([{ ...json.data, project: projects.find((p: any) => p.id === form.projectId) ?? null }, ...okrs]);
      setShowAdd(false);
      setForm({ ...form, objective: "", description: "", keyResults: [{ id: "kr-0", title: "", target: 100, current: 0, unit: "%" }] });
      toast.success("OKR created");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function updateKR(okrId: string, krIndex: number, field: keyof KeyResult, value: any) {
    const okr = okrs.find((o) => o.id === okrId);
    if (!okr) return;
    const newKRs = okr.keyResults.map((k, i) => (i === krIndex ? { ...k, [field]: value } : k));
    try {
      const res = await fetch(`/api/okrs/${okrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyResults: newKRs }),
      });
      if (!res.ok) throw new Error();
      setOkrs((all) => all.map((o) => (o.id === okrId ? { ...o, keyResults: newKRs } : o)));
      if (active?.id === okrId) setActive({ ...active, keyResults: newKRs });
    } catch {
      toast.error("Failed to save");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this OKR?")) return;
    try {
      const res = await fetch(`/api/okrs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOkrs(okrs.filter((o) => o.id !== id));
      if (active?.id === id) setActive(null);
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{okrs.length} OKR(s) · Current period: {currentQuarter} {currentYear}</p>
        <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
          <Plus className="w-4 h-4 mr-1.5" /> New OKR
        </Button>
      </div>

      {okrs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No OKRs yet. Set your first ambitious objective.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {okrs.map((o) => {
            const progress = calcProgress(o.keyResults ?? []);
            return (
              <div key={o.id} className="rounded-xl card-festive p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{o.objective}</h3>
                      <span className="text-xs text-muted-foreground">{o.quarter} {o.year}</span>
                      {o.project && (
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded text-white" style={{ background: o.project.color }}>
                          {o.project.name}
                        </span>
                      )}
                    </div>
                    {o.description && <p className="text-xs text-muted-foreground mb-3">{o.description}</p>}

                    <div className="flex items-center gap-3 mb-3">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-sm font-bold tabular-nums gradient-text">{progress}%</span>
                    </div>

                    <div className="space-y-2">
                      {(o.keyResults ?? []).map((k, i) => {
                        const pct = Math.min(100, ((k.current ?? 0) / Math.max(1, k.target)) * 100);
                        return (
                          <div key={k.id ?? i} className="flex items-center gap-3 text-sm">
                            <span className="text-xs text-muted-foreground w-6">KR{i + 1}</span>
                            <span className="flex-1 truncate">{k.title}</span>
                            <Input
                              type="number"
                              defaultValue={k.current}
                              onBlur={(e) => updateKR(o.id, i, "current", Number(e.target.value))}
                              className="w-20 h-7 text-xs"
                            />
                            <span className="text-xs text-muted-foreground w-20">/ {k.target} {k.unit}</span>
                            <span className="text-xs font-medium w-10 text-right">{Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(o.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New OKR</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Objective (aspirational, e.g. 'Launch v2.0 with rave reviews')" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
            <Textarea placeholder="Why this matters" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-3 gap-2">
              <Select value={form.quarter} onValueChange={(v) => setForm({ ...form, quarter: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Q1","Q2","Q3","Q4"].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Key Results (measurable)</label>
              <div className="space-y-2">
                {form.keyResults.map((kr, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr,80px,60px,auto] gap-2">
                    <Input placeholder="Key result title" value={kr.title} onChange={(e) => {
                      const next = [...form.keyResults];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setForm({ ...form, keyResults: next });
                    }} className="h-8 text-xs" />
                    <Input type="number" placeholder="Target" value={kr.target} onChange={(e) => {
                      const next = [...form.keyResults];
                      next[idx] = { ...next[idx], target: Number(e.target.value) };
                      setForm({ ...form, keyResults: next });
                    }} className="h-8 text-xs" />
                    <Input placeholder="Unit" value={kr.unit} onChange={(e) => {
                      const next = [...form.keyResults];
                      next[idx] = { ...next[idx], unit: e.target.value };
                      setForm({ ...form, keyResults: next });
                    }} className="h-8 text-xs" />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                      setForm({ ...form, keyResults: form.keyResults.filter((_, i) => i !== idx) });
                    }}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                  setForm({ ...form, keyResults: [...form.keyResults, { id: `kr-${form.keyResults.length}`, title: "", target: 100, current: 0, unit: "%" }] });
                }}>
                  <Plus className="w-3 h-3 mr-1" /> Add Key Result
                </Button>
              </div>
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
