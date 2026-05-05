"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Building2 } from "lucide-react";

type Dept = { id: string; name: string; code: string | null; description: string | null; headId: string | null };
type User = { id: string; name: string };

export function DepartmentsManager({ initial, users }: { initial: Dept[]; users: User[] }) {
  const [depts, setDepts] = useState<Dept[]>(initial);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headId, setHeadId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!name.trim()) return toast.error("Name required");
    setAdding(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          headId: headId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDepts((d) => [...d, json.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setCode(""); setDescription(""); setHeadId("");
      toast.success("Department added");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove department?")) return;
    try {
      const res = await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDepts((d) => d.filter((x) => x.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed");
    }
  }

  async function updateHead(id: string, newHeadId: string) {
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headId: newHeadId || null }),
      });
      if (!res.ok) throw new Error();
      setDepts((d) => d.map((x) => (x.id === id ? { ...x, headId: newHeadId || null } : x)));
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add Department</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="Name (e.g. Engineering)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Code (optional, e.g. ENG)" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        <div className="flex gap-2">
          <Select value={headId} onValueChange={setHeadId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Department head (optional)" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={adding}>
            <Plus className="w-4 h-4 mr-1" />{adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">All Departments ({depts.length})</h3>
        {depts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Building2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No departments yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {depts.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.code && <span className="text-xs font-mono text-muted-foreground">{d.code}</span>}
                  </div>
                  {d.description && <p className="text-xs text-muted-foreground truncate">{d.description}</p>}
                </div>
                <Select value={d.headId ?? ""} onValueChange={(v) => updateHead(d.id, v)}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="No head" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— No head —</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(d.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
