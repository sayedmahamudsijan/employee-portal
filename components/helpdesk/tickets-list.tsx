"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/shared/avatar";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Ticket as TicketIcon, MessageCircle } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "gradient-info text-white",
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RESOLVED: "gradient-success text-white",
  CLOSED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-blue-600",
  HIGH: "text-amber-600",
  URGENT: "text-red-600 font-semibold",
};

const CATEGORIES = ["IT", "HR", "Office", "Other"];

export function TicketsList({ initial, canCreate }: { initial: any[]; canCreate: boolean }) {
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "IT", priority: "MEDIUM" });

  async function create() {
    if (!form.title || !form.description) return toast.error("Title & description required");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setItems([{ ...json.data, creator: { id: "", name: "You", image: null }, assignee: null, _count: { comments: 0 } }, ...items]);
      setShowAdd(false);
      setForm({ title: "", description: "", category: "IT", priority: "MEDIUM" });
      toast.success(`Ticket #${json.data.number} opened`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function openTicket(id: string) {
    const res = await fetch(`/api/tickets/${id}`);
    const json = await res.json();
    if (json.data) setActive(json.data);
  }

  async function changeStatus(status: string) {
    if (!active) return;
    try {
      const res = await fetch(`/api/tickets/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setActive({ ...active, status });
      setItems((it) => it.map((i) => (i.id === active.id ? { ...i, status } : i)));
      toast.success("Updated");
    } catch {
      toast.error("Failed");
    }
  }

  async function addComment() {
    if (!comment.trim() || !active) return;
    try {
      const res = await fetch(`/api/tickets/${active.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setActive({ ...active, comments: [...active.comments, json.data] });
      setComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{items.length} ticket(s)</p>
          <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
            <Plus className="w-4 h-4 mr-1.5" /> New Ticket
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <TicketIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No tickets here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {items.map((t) => (
            <button key={t.id} onClick={() => openTicket(t.id)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/30 text-left">
              <Avatar name={t.creator.name} src={t.creator.image} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">#{t.number}</span>
                  <span className="font-medium truncate">{t.title}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{t.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.creator.name} · {timeAgo(t.createdAt)}
                  {t._count.comments > 0 && <span className="ml-2 inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{t._count.comments}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[t.status]}`}>{t.status.replace("_", " ")}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New ticket dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="What's the issue?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Describe the issue in detail" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["LOW","MEDIUM","HIGH","URGENT"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={create} className="gradient-brand text-white border-0">Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket detail */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        {active && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">#{active.number}</span>
                <span>{active.title}</span>
                <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[active.status]}`}>{active.status.replace("_", " ")}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {active.creator.name} · {active.category} · {active.priority}
              </p>
              <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">{active.description}</p>

              <div className="flex gap-2 flex-wrap">
                {["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"].map((s) => (
                  <Button key={s} size="sm" variant={active.status === s ? "default" : "outline"} className="h-7 text-xs" onClick={() => changeStatus(s)}>
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Comments ({active.comments?.length ?? 0})</h3>
                {(active.comments ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar name={c.author.name} src={c.author.image} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{c.author.name} · {timeAgo(c.createdAt)}</p>
                      <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} />
                  <Button onClick={addComment} className="gradient-brand text-white border-0">Send</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
