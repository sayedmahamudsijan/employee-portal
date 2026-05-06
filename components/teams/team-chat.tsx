"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/shared/avatar";
import type { OnlineStatus } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  Send, ChevronLeft, Users, Settings, Link2, Plus, X, Search, Check,
  Smile, Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type SimpleUser = { id: string; name: string; image: string | null; jobTitle?: string | null; lastSeenAt?: string | null };
type Member     = { id: string; userId: string; role: string; joinedAt: string; user: SimpleUser & { department?: string | null } };
type Team       = {
  id: string; name: string; description: string | null; link: string | null; emoji: string | null;
  createdBy: { id: string; name: string; image: string | null };
  members: Member[];
};
type Message    = {
  id: string; content: string; type: string; createdAt: string;
  user: { id: string; name: string; image: string | null };
};
type AllUser    = { id: string; name: string; email: string; image: string | null; jobTitle: string | null };

// ── Quick status presets ─────────────────────────────────────────────────────

const QUICK_STATUSES = [
  { emoji: "🟢", label: "Starting work",     text: "🟢 Starting work for the day!" },
  { emoji: "👋", label: "Good morning",       text: "👋 Good morning, team!" },
  { emoji: "🌙", label: "Good evening",       text: "🌙 Good evening everyone!" },
  { emoji: "☕", label: "Coffee break",        text: "☕ On a quick coffee break — back in 15 min" },
  { emoji: "🍽️", label: "Lunch break",        text: "🍽️ Heading out for lunch, back in ~1 hour" },
  { emoji: "🔙", label: "Back at desk",       text: "🔙 Back at my desk!" },
  { emoji: "🎯", label: "Deep focus",         text: "🎯 Deep focus mode — notifications snoozed for a bit" },
  { emoji: "📋", label: "In a meeting",       text: "📋 Heading into a meeting, back soon" },
  { emoji: "😴", label: "AFK 1 hour",         text: "😴 AFK for about an hour, be back later" },
  { emoji: "🔥", label: "On a roll!",         text: "🔥 On a roll today — great progress!" },
  { emoji: "🚀", label: "Just shipped!",      text: "🚀 Just shipped something! 🎉" },
  { emoji: "✅", label: "Task done",           text: "✅ Just wrapped up a task — what's next?" },
  { emoji: "🤔", label: "Need input",         text: "🤔 Could use some input when anyone has a moment" },
  { emoji: "❓", label: "Need help",          text: "❓ Anyone free to help me with something?" },
  { emoji: "📣", label: "Heads up",           text: "📣 Heads up: " },
  { emoji: "👀", label: "Following up",       text: "👀 Following up on — " },
  { emoji: "🌟", label: "Shoutout",           text: "🌟 Shoutout to " },
  { emoji: "🌙", label: "Signing off",        text: "🌙 Signing off for today — see you all tomorrow! 👋" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function onlineStatus(lastSeenAt: string | null | undefined): OnlineStatus {
  if (!lastSeenAt) return "offline";
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  return ms < 3 * 60_000 ? "online" : ms < 30 * 60_000 ? "away" : "offline";
}

function lastSeenLabel(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return "Never seen";
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < 60_000) return "Active now";
  return `Active ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`;
}

function msgDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, showAvatar }: { msg: Message; isMine: boolean; showAvatar: boolean }) {
  const isSystem = msg.type === "SYSTEM";

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-0.5 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  const isStatus = msg.type === "STATUS";

  return (
    <div className={cn("flex items-end gap-2", isMine && "flex-row-reverse")}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-7">
        {showAvatar && !isMine && (
          <Avatar name={msg.user.name} src={msg.user.image} size="sm" />
        )}
      </div>

      <div className={cn("flex flex-col gap-0.5 max-w-[72%]", isMine && "items-end")}>
        {/* Sender name (only for others, only if avatar shown) */}
        {!isMine && showAvatar && (
          <span className="text-xs font-semibold text-foreground px-1">{msg.user.name}</span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
            isMine
              ? "gradient-brand text-white rounded-br-sm"
              : isStatus
                ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-foreground rounded-bl-sm"
                : "bg-muted/70 text-foreground rounded-bl-sm"
          )}
        >
          {msg.content}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {format(new Date(msg.createdAt), "HH:mm")}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  team: Team;
  initialMessages: Message[];
  currentUserId: string;
  currentUserRole: string;
  allUsers: AllUser[];
}

export function TeamChat({ team, initialMessages, currentUserId, currentUserRole, allUsers }: Props) {
  const router = useRouter();
  const [messages, setMessages]     = useState<Message[]>(initialMessages);
  const [text, setText]             = useState("");
  const [sending, setSending]       = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [showQuick, setShowQuick]   = useState(false);
  const [showAddMember, setShowAdd] = useState(false);
  const [memberSearch, setMSrch]    = useState("");
  const [selectedAdd, setSelAdd]    = useState<string[]>([]);
  const [addingSaving, setAddSaving] = useState(false);
  const [onlineMap, setOnlineMap]   = useState<Record<string, OnlineStatus>>({});
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOwner = team.members.find((m) => m.userId === currentUserId)?.role === "OWNER";
  const isAdmin = ["ADMIN","CEO","CMO","CTO"].includes(currentUserRole);

  // ── Poll for new messages every 5 s ─────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch(`/api/teams/${team.id}/messages`);
      const json = await res.json();
      if (json.data) setMessages(json.data);
    } catch {}
  }, [team.id]);

  useEffect(() => {
    pollRef.current = setInterval(fetchMessages, 5_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // ── Fetch online statuses every 20 s ────────────────────────────────────

  useEffect(() => {
    const ids = team.members.map((m) => m.userId).join(",");
    async function fetchOnline() {
      try {
        const res  = await fetch(`/api/users/online?ids=${ids}`);
        const json = await res.json();
        if (json.data) {
          const map: Record<string, OnlineStatus> = {};
          (json.data as { id: string; status: OnlineStatus }[]).forEach((u) => { map[u.id] = u.status; });
          setOnlineMap(map);
        }
      } catch {}
    }
    fetchOnline();
    const iv = setInterval(fetchOnline, 20_000);
    return () => clearInterval(iv);
  }, [team.members]);

  // ── Auto-scroll to bottom on new messages ───────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────

  async function send(content: string, type = "TEXT") {
    if (!content.trim()) return;
    setSending(true);
    setText("");
    setShowQuick(false);
    try {
      const res = await fetch(`/api/teams/${team.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages((prev) => [...prev, json.data]);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
      setText(content); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(text);
    }
  }

  // ── Add members ───────────────────────────────────────────────────────────

  const existingIds = new Set(team.members.map((m) => m.userId));
  const addable     = allUsers.filter(
    (u) => !existingIds.has(u.id) &&
    (memberSearch === "" ||
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  async function addMembers() {
    if (selectedAdd.length === 0) return;
    setAddSaving(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedAdd }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Members added!");
      setShowAdd(false);
      setSelAdd([]);
      router.refresh();
    } catch {
      toast.error("Failed to add members");
    } finally {
      setAddSaving(false);
    }
  }

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this team?`)) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${name} removed`);
      router.refresh();
    } catch {
      toast.error("Failed to remove");
    }
  }

  // ── Group messages by date ────────────────────────────────────────────────

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const d = msgDateLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.date === d) last.msgs.push(msg);
    else grouped.push({ date: d, msgs: [msg] });
  });

  const onlineCount = team.members.filter((m) => (onlineMap[m.userId] ?? "offline") === "online").length;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-2xl overflow-hidden border border-border shadow-lg">

      {/* ── LEFT: Chat area ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-card">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <Link href="/teams" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-lg shadow-sm">
            {team.emoji ?? "👥"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{team.name}</p>
            <p className="text-xs text-muted-foreground">
              {onlineCount > 0 ? (
                <span className="text-green-500 font-medium">{onlineCount} online</span>
              ) : null}
              {onlineCount > 0 && team.members.length > onlineCount ? " · " : null}
              {team.members.length - onlineCount > 0 ? `${team.members.length - onlineCount} offline` : null}
            </p>
          </div>

          {team.link && (
            <a href={team.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Team link">
              <Link2 className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={cn("text-muted-foreground hover:text-foreground transition-colors", showMembers && "text-primary")}
            title="Toggle members panel"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {grouped.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground font-medium px-2 bg-card rounded-full border border-border/50">
                  {date}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-1">
                {msgs.map((msg, idx) => {
                  const prev = msgs[idx - 1];
                  const showAvatar = !prev || prev.user.id !== msg.user.id || prev.type === "SYSTEM";
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.user.id === currentUserId}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-3xl mb-4 shadow-lg">
                {team.emoji ?? "👥"}
              </div>
              <p className="font-semibold text-foreground text-lg">{team.name}</p>
              <p className="text-muted-foreground mt-1">No messages yet. Say hello! 👋</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick status picker ──────────────────────────────────────── */}
        {showQuick && (
          <div className="border-t border-border px-4 py-3 bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Status</p>
              <button onClick={() => setShowQuick(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STATUSES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.text, "STATUS")}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuick(!showQuick)}
              className={cn(
                "flex-shrink-0 p-2 rounded-lg transition-colors",
                showQuick ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Quick status"
            >
              <Zap className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Message team or add a status…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="pr-4 bg-muted/50 border-border/50 focus:bg-background"
              />
            </div>

            <Button
              size="icon"
              disabled={!text.trim() || sending}
              onClick={() => send(text)}
              className="gradient-brand text-white border-0 flex-shrink-0 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-10">
            Press <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send · <kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">⚡</kbd> for quick statuses
          </p>
        </div>
      </div>

      {/* ── RIGHT: Members panel ─────────────────────────────────────────── */}
      {showMembers && (
        <div className="w-64 flex-shrink-0 border-l border-border bg-sidebar flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm text-foreground">Members ({team.members.length})</p>
            {(isOwner || isAdmin) && (
              <button
                onClick={() => setShowAdd(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Add member"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {/* Online first */}
            {(["online","away","offline"] as OnlineStatus[]).map((statusGroup) => {
              const groupMembers = team.members.filter(
                (m) => (onlineMap[m.userId] ?? "offline") === statusGroup
              );
              if (groupMembers.length === 0) return null;

              const groupLabel = { online: "Online", away: "Away", offline: "Offline" }[statusGroup];
              return (
                <div key={statusGroup} className="mb-3">
                  <p className="px-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    {groupLabel} — {groupMembers.length}
                  </p>
                  {groupMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="group flex items-center gap-2.5 px-3 py-1.5 hover:bg-sidebar-accent/30 transition-colors"
                    >
                      <Avatar
                        name={m.user.name}
                        src={m.user.image}
                        size="sm"
                        status={statusGroup}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                          {m.user.name}
                          {m.role === "OWNER" && (
                            <span className="text-[9px] text-amber-500 font-bold">OWNER</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {lastSeenLabel(m.user.lastSeenAt)}
                        </p>
                      </div>
                      {/* Remove button — owner/admin only, can't remove self-owner */}
                      {(isOwner || isAdmin) && !(m.role === "OWNER" && m.userId === currentUserId) && (
                        <button
                          onClick={() => removeMember(m.userId, m.user.name)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Team info footer */}
          {team.description && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">{team.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Add member modal ──────────────────────────────────────────────── */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Add Members</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search…" className="pl-9" value={memberSearch} onChange={(e) => setMSrch(e.target.value)} />
              </div>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
                {addable.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No more people to add</p>
                ) : addable.map((u) => {
                  const isSel = selectedAdd.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelAdd((p) => isSel ? p.filter((x) => x !== u.id) : [...p, u.id])}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 text-left transition-colors", isSel ? "bg-primary/8" : "hover:bg-muted/30")}
                    >
                      <Avatar name={u.name} src={u.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.jobTitle ?? u.email}</p>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={addMembers} disabled={selectedAdd.length === 0 || addingSaving} className="gradient-brand text-white border-0">
                {addingSaving ? "Adding…" : `Add ${selectedAdd.length || ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
