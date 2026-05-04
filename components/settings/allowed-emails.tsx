"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Entry = { id: string; email: string; note: string | null; createdAt: string };

export function AllowedEmailsManager({ initial }: { initial: Entry[] }) {
  const [entries, setEntries] = useState(initial);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), note: note.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to add email"); return; }
      setEntries((e) => [json.data, ...e]);
      setEmail("");
      setNote("");
      toast.success("Email whitelisted — they can now sign in without approval");
    } catch {
      toast.error("Failed to add email");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/allowed-emails/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((e) => e.filter((x) => x.id !== id));
      toast.success("Removed from whitelist");
    } catch {
      toast.error("Failed to remove");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <p>Emails added here bypass the approval queue — they sign in and get immediate access. Anyone not on this list <strong>and</strong> not on the allowed domain will be blocked from signing up entirely.</p>
        </div>
      </div>

      {/* Add form */}
      <div className="flex gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@gmail.com"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-48"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} disabled={adding || !email.trim()} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No whitelisted emails yet.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Note</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{e.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.note ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(e.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
