"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Briefcase, UserPlus, ArrowDownToLine } from "lucide-react";

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  warrantyEnd: string | null;
  status: "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETIRED";
  notes: string | null;
  assignments: { id: string; user: { id: string; name: string; email: string; image: string | null } }[];
};

type User = { id: string; name: string };

const CATEGORIES = ["Laptop", "Desktop", "Monitor", "Phone", "Tablet", "Headset", "Keyboard", "Mouse", "Furniture", "Other"];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_REPAIR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RETIRED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function AssetsManager({ initial, users }: { initial: Asset[]; users: User[] }) {
  const [assets, setAssets] = useState<Asset[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null);

  // form
  const [form, setForm] = useState({
    assetTag: "", name: "", category: "Laptop",
    serialNumber: "", purchaseDate: "", purchaseCost: "", warrantyEnd: "", notes: "",
  });

  async function addAsset() {
    if (!form.assetTag || !form.name) return toast.error("Asset tag and name required");
    try {
      const res = await fetch("/api/admin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAssets((a) => [{ ...json.data, assignments: [] }, ...a]);
      setForm({ assetTag: "", name: "", category: "Laptop", serialNumber: "", purchaseDate: "", purchaseCost: "", warrantyEnd: "", notes: "" });
      setShowAdd(false);
      toast.success("Asset added");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAssets((a) => a.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  async function assignAsset(asset: Asset, userId: string | null) {
    try {
      const res = await fetch(`/api/admin/assets/${asset.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      const user = users.find((u) => u.id === userId);
      setAssets((all) =>
        all.map((a) =>
          a.id === asset.id
            ? {
                ...a,
                status: userId ? "ASSIGNED" : "AVAILABLE",
                assignments: userId && user
                  ? [{ id: "new", user: { id: user.id, name: user.name, email: "", image: null } }]
                  : [],
              }
            : a
        )
      );
      setAssignTarget(null);
      toast.success(userId ? "Assigned" : "Returned");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{assets.length} asset(s) tracked</p>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Briefcase className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No assets tracked yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Purchase</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((a) => {
                const assignedTo = a.assignments[0]?.user;
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{a.assetTag}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.category}{a.serialNumber ? ` · S/N ${a.serialNumber}` : ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[a.status]}`}>
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={assignedTo.name} src={assignedTo.image} size="xs" />
                          <span className="text-xs">{assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.purchaseDate ? formatDate(a.purchaseDate) : "—"}
                      {a.purchaseCost ? <span className="ml-1">· {a.purchaseCost.toLocaleString()}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {assignedTo ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => assignAsset(a, null)}>
                            <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Return
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAssignTarget(a)}>
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteAsset(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add asset dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Asset tag (MBD-LAP-001)" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Name (e.g. MacBook Pro 14&quot;)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Serial number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Purchase date</label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cost</label>
                <Input type="number" placeholder="0" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Warranty end</label>
                <Input type="date" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
              </div>
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={addAsset}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
        {assignTarget && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Assign {assignTarget.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select onValueChange={(v) => assignAsset(assignTarget, v)}>
                <SelectTrigger><SelectValue placeholder="Choose employee" /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
