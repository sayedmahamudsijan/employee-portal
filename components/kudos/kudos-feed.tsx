"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, Send } from "lucide-react";

type Kudos = {
  id: string;
  message: string;
  category: string;
  emoji: string;
  createdAt: string;
  from: { id: string; name: string; image: string | null };
  to: { id: string; name: string; image: string | null };
};

type User = { id: string; name: string; image: string | null };

const CATEGORIES = [
  { v: "teamwork", n: "Teamwork", e: "🤝" },
  { v: "innovation", n: "Innovation", e: "💡" },
  { v: "leadership", n: "Leadership", e: "👑" },
  { v: "excellence", n: "Excellence", e: "⭐" },
  { v: "kindness", n: "Kindness", e: "❤️" },
  { v: "growth", n: "Growth", e: "🌱" },
  { v: "delivery", n: "Delivery", e: "🚀" },
];

export function KudosFeed({
  initial, users, currentUserId,
}: {
  initial: Kudos[];
  users: User[];
  currentUserId: string;
}) {
  const [feed, setFeed] = useState<Kudos[]>(initial);
  const [toId, setToId] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("teamwork");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!toId) return toast.error("Pick someone to recognise");
    if (!message.trim()) return toast.error("Write a message");
    setSending(true);
    try {
      const emoji = CATEGORIES.find((c) => c.v === category)?.e ?? "🌟";
      const res = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId, message: message.trim(), category, emoji, isPublic: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFeed((f) => [json.data, ...f]);
      setMessage(""); setToId("");
      toast.success("Kudos sent! 🎉");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
      {/* Feed */}
      <div className="space-y-3">
        {feed.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-1">No kudos yet</h3>
            <p className="text-xs text-muted-foreground">Be the first to recognise a teammate's great work.</p>
          </div>
        ) : (
          feed.map((k) => (
            <div key={k.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{k.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{k.from.name}</span>
                    <span className="text-xs text-muted-foreground">recognised</span>
                    <span className="font-medium text-sm">{k.to.name}</span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {k.category}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{k.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Avatar name={k.from.name} src={k.from.image} size="xs" />
                    <span>{timeAgo(k.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Give kudos card */}
      <div className="lg:sticky lg:top-4 self-start rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Give Kudos</h3>
        </div>

        <Select value={toId} onValueChange={setToId}>
          <SelectTrigger><SelectValue placeholder="Recognise…" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.v}
                onClick={() => setCategory(c.v)}
                className={`text-xs px-2 py-2 rounded-md border transition ${
                  category === c.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="text-base block">{c.e}</span>
                {c.n}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="What did they do that was awesome?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <Button onClick={send} disabled={sending} className="w-full">
          <Send className="w-4 h-4 mr-1.5" />
          {sending ? "Sending…" : "Send Kudos"}
        </Button>
      </div>
    </div>
  );
}
