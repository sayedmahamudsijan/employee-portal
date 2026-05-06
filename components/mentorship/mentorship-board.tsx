"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, GraduationCap, ArrowRight, Trash2 } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "gradient-success text-white",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export function MentorshipBoard({ mine, all, users, currentUserId, canManage }: any) {
  const [tab, setTab] = useState("mine");
  const [showAdd, setShowAdd] = useState(false);
  const [items, setItems] = useState({ mine, all });
  const [form, setForm] = useState({ mentorId: "", menteeId: "", focusArea: "", goals: "" });

  async function pair() {
    if (!form.mentorId || !form.menteeId) return toast.error("Pick mentor and mentee");
    try {
      const res = await fetch("/api/mentorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setItems({ ...items, all: [json.data, ...items.all] });
      setShowAdd(false);
      setForm({ mentorId: "", menteeId: "", focusArea: "", goals: "" });
      toast.success("Pairing created");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  function PairingCard({ m }: { m: any }) {
    return (
      <div className="rounded-xl card-festive p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[m.status]}`}>{m.status}</span>
          <span className="text-xs text-muted-foreground ml-auto">Since {formatDate(m.startDate)}</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar name={m.mentor.name} src={m.mentor.image} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Mentor</p>
              <p className="text-sm font-medium truncate">{m.mentor.name}</p>
              {m.mentor.jobTitle && <p className="text-xs text-muted-foreground truncate">{m.mentor.jobTitle}</p>}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar name={m.mentee.name} src={m.mentee.image} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Mentee</p>
              <p className="text-sm font-medium truncate">{m.mentee.name}</p>
              {m.mentee.jobTitle && <p className="text-xs text-muted-foreground truncate">{m.mentee.jobTitle}</p>}
            </div>
          </div>
        </div>
        {m.focusArea && (
          <p className="text-xs"><span className="text-muted-foreground">Focus:</span> {m.focusArea}</p>
        )}
        {m.goals && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.goals}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {tab === "mine" ? `${items.mine.length} active pairing(s) for you` : `${items.all.length} total pairing(s)`}
        </p>
        {canManage && (
          <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
            <Plus className="w-4 h-4 mr-1.5" /> Pair Mentor & Mentee
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mine">My Pairings</TabsTrigger>
          {canManage && <TabsTrigger value="all">All Pairings</TabsTrigger>}
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          {items.mine.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No pairings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items.mine.map((m: any) => <PairingCard key={m.id} m={m} />)}</div>
          )}
        </TabsContent>
        {canManage && (
          <TabsContent value="all" className="mt-4">
            {items.all.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pairings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{items.all.map((m: any) => <PairingCard key={m.id} m={m} />)}</div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Pair Mentor & Mentee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.mentorId} onValueChange={(v) => setForm({ ...form, mentorId: v })}>
              <SelectTrigger><SelectValue placeholder="Mentor (more experienced)" /></SelectTrigger>
              <SelectContent>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.menteeId} onValueChange={(v) => setForm({ ...form, menteeId: v })}>
              <SelectTrigger><SelectValue placeholder="Mentee" /></SelectTrigger>
              <SelectContent>{users.filter((u: any) => u.id !== form.mentorId).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Focus area (e.g., Engineering leadership)" value={form.focusArea} onChange={(e) => setForm({ ...form, focusArea: e.target.value })} />
            <Textarea placeholder="Goals for this pairing" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={pair} className="gradient-brand text-white border-0">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
