"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ListChecks, X } from "lucide-react";

type Template = {
  id: string;
  name: string;
  role: string | null;
  items: { id: string; title: string; description?: string }[];
};

const DEFAULT_ITEMS = [
  { title: "Sign offer letter & contract" },
  { title: "Submit identification documents" },
  { title: "Set up email & accounts" },
  { title: "Receive laptop & equipment" },
  { title: "Complete HR orientation" },
  { title: "Meet your team" },
  { title: "Review company handbook" },
  { title: "Set up workstation" },
  { title: "Complete security training" },
  { title: "Schedule 30/60/90-day check-ins" },
];

export function OnboardingTemplatesManager({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS.map((i) => i.title));
  const [newItem, setNewItem] = useState("");

  async function add() {
    if (!name.trim() || items.length === 0) return toast.error("Name and at least one item required");
    try {
      const payload = {
        name: name.trim(),
        role: role.trim() || null,
        items: items.map((title, idx) => ({ id: `item-${idx}`, title })),
      };
      const res = await fetch("/api/admin/onboarding/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTemplates((t) => [json.data, ...t]);
      setName(""); setRole(""); setItems(DEFAULT_ITEMS.map((i) => i.title)); setShowAdd(false);
      toast.success("Template created");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete template?")) return;
    try {
      const res = await fetch(`/api/admin/onboarding/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates((t) => t.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template(s) · Used to onboard new hires</p>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <ListChecks className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No onboarding templates yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{t.name}</h4>
                  {t.role && <p className="text-xs text-muted-foreground">For role: {t.role}</p>}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(t.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ul className="space-y-1">
                {t.items.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    {i.title}
                  </li>
                ))}
                {t.items.length > 5 && (
                  <li className="text-xs text-muted-foreground italic">+ {t.items.length - 5} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Onboarding Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Template name (e.g. Engineering Onboarding)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="For role (optional, e.g. Software Engineer)" value={role} onChange={(e) => setRole(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Checklist items</label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                    <Input
                      value={item}
                      onChange={(e) => setItems(items.map((it, i) => (i === idx ? e.target.value : it)))}
                      className="h-8 text-xs"
                    />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add new item & press Enter"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newItem.trim()) {
                      e.preventDefault();
                      setItems([...items, newItem.trim()]);
                      setNewItem("");
                    }
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={add}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
