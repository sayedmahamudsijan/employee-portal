"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Users, MessageSquare, Link2, Search, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type User = { id: string; name: string; email: string; image: string | null; jobTitle: string | null; department?: string | null };
type TeamUser = { id: string; name: string; image: string | null; jobTitle: string | null; lastSeenAt: string | null };
type Member = { id: string; userId: string; role: string; joinedAt: string; user: TeamUser };
type Team = {
  id: string; name: string; description: string | null; link: string | null; emoji: string | null;
  createdBy: { id: string; name: string; image: string | null };
  members: Member[];
  _count: { messages: number };
  updatedAt: string;
};

function onlineStatus(lastSeenAt: string | null): "online" | "away" | "offline" {
  if (!lastSeenAt) return "offline";
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  return ms < 3 * 60_000 ? "online" : ms < 30 * 60_000 ? "away" : "offline";
}

interface Props {
  initialTeams: Team[];
  allUsers: User[];
  currentUserId: string;
  currentUserRole: string;
}

const EMOJIS = ["👥","🚀","💡","🔥","⚡","🎯","🌟","🛠️","🎨","📊","🏆","💬","🤝","🌐","📣"];

export function TeamsList({ initialTeams, allUsers, currentUserId }: Props) {
  const router   = useRouter();
  const [teams, setTeams]     = useState(initialTeams);
  const [showCreate, setShow] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");

  const [form, setForm] = useState({
    name: "", description: "", link: "", emoji: "👥",
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [selected, setSelected]         = useState<string[]>([]);

  const filteredUsers = allUsers.filter(
    (u) => u.id !== currentUserId &&
    (memberSearch === "" ||
      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  function toggleMember(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function create() {
    if (!form.name.trim()) return toast.error("Team name required");
    setSaving(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, memberIds: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Team created!");
      router.push(`/teams/${json.data.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  const filtered = teams.filter((t) =>
    search === "" || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Create focused workspaces with group chat for your team members"
        action={
          <Button onClick={() => setShow(true)} className="gradient-brand text-white border-0 gap-2">
            <Plus className="w-4 h-4" /> New Team
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Teams grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No teams yet — create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group card-festive rounded-xl p-5 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center text-xl shadow-md flex-shrink-0">
                    {team.emoji ?? "👥"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {team.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {team.link && (
                  <a
                    href={team.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  >
                    <Link2 className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Description */}
              {team.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
              )}

              {/* Member avatars with status dots */}
              <div className="flex items-center gap-1 flex-wrap">
                {team.members.slice(0, 6).map((m) => (
                  <Avatar
                    key={m.userId}
                    name={m.user.name}
                    src={m.user.image}
                    size="sm"
                    status={onlineStatus(m.user.lastSeenAt)}
                  />
                ))}
                {team.members.length > 6 && (
                  <span className="text-xs text-muted-foreground ml-1">+{team.members.length - 6}</span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {team._count.messages} message{team._count.messages !== 1 ? "s" : ""}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Create team modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg gradient-text">Create New Team</h2>
              <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Emoji + name row */}
              <div className="flex gap-3">
                <div className="space-y-1">
                  <label>Emoji</label>
                  <select
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-border bg-background text-center text-xl cursor-pointer"
                  >
                    {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label>Team Name *</label>
                  <Input
                    placeholder="e.g. Frontend Squad"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label>Description</label>
                <Textarea
                  placeholder="What does this team work on?"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label>Link (optional)</label>
                <Input
                  placeholder="https://notion.so/your-team-page"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>

              {/* Member search */}
              <div className="space-y-2">
                <label>Add Members</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people…"
                    className="pl-9"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.map((id) => {
                      const u = allUsers.find((u) => u.id === id);
                      if (!u) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {u.name}
                          <button onClick={() => toggleMember(id)}><X className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
                  {filteredUsers.map((u) => {
                    const isSelected = selected.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                          isSelected ? "bg-primary/8" : "hover:bg-muted/30"
                        )}
                      >
                        <Avatar name={u.name} src={u.image} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.jobTitle ?? u.email}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-sm text-muted-foreground">{selected.length + 1} member{selected.length !== 0 ? "s" : ""} (including you)</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
                <Button onClick={create} disabled={saving} className="gradient-brand text-white border-0 min-w-[100px]">
                  {saving ? "Creating…" : "Create Team"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
