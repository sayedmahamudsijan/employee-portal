"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, Plus, CalendarDays } from "lucide-react";

type Holiday = { id: string; name: string; date: string; year: number };

export function HolidaysManager({ initial, year }: { initial: Holiday[]; year: number }) {
  const [holidays, setHolidays] = useState<Holiday[]>(initial);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!name.trim() || !date) {
      toast.error("Name and date are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), date }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setHolidays((h) => [...h, json.data].sort((a, b) => +new Date(a.date) - +new Date(b.date)));
      setName("");
      setDate("");
      toast.success("Holiday added");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add holiday");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this holiday?")) return;
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setHolidays((h) => h.filter((x) => x.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Add Holiday</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px,auto] gap-2">
          <Input placeholder="e.g. Independence Day" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button onClick={add} disabled={adding}>
            <Plus className="w-4 h-4 mr-1" />
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">{year} Holidays ({holidays.length})</h3>
        {holidays.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No holidays for {year} yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                </div>
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(h.id)}
                >
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
