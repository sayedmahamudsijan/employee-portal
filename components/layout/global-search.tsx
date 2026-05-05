"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Users, CheckSquare, FileText, Megaphone, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";

type Results = {
  users: { id: string; name: string; email: string; image: string | null; jobTitle: string | null }[];
  tasks: { id: string; title: string; status: string; priority: string }[];
  documents: { id: string; title: string; category: string; fileUrl: string }[];
  announcements: { id: string; title: string; createdAt: string }[];
};

const EMPTY: Results = { users: [], tasks: [], documents: [], announcements: [] };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to open
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!q || q.length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.data) setResults(json.data);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const total = results.users.length + results.tasks.length + results.documents.length + results.announcements.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background text-sm text-muted-foreground hover:bg-muted transition w-full sm:w-64"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden sm:inline text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-popover border border-border rounded-xl shadow-xl w-full max-w-xl flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users, tasks, documents, announcements…"
                className="flex-1 py-3.5 bg-transparent outline-none text-sm"
              />
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && <div className="p-6 text-center text-sm text-muted-foreground">Searching…</div>}
              {!loading && q.length >= 2 && total === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No results for "{q}"</div>
              )}
              {!loading && q.length < 2 && (
                <div className="p-6 text-center text-sm text-muted-foreground">Type at least 2 characters</div>
              )}

              {results.users.length > 0 && (
                <Section icon={Users} label="People">
                  {results.users.map((u) => (
                    <Link key={u.id} href={`/team`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-muted">
                      <Avatar name={u.name} src={u.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.jobTitle ?? u.email}</p>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}

              {results.tasks.length > 0 && (
                <Section icon={CheckSquare} label="Tasks">
                  {results.tasks.map((t) => (
                    <Link key={t.id} href={`/tasks`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-muted">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.status} · {t.priority}</p>
                      </div>
                    </Link>
                  ))}
                </Section>
              )}

              {results.documents.length > 0 && (
                <Section icon={FileText} label="Documents">
                  {results.documents.map((d) => (
                    <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-muted">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.category}</p>
                      </div>
                    </a>
                  ))}
                </Section>
              )}

              {results.announcements.length > 0 && (
                <Section icon={Megaphone} label="Announcements">
                  {results.announcements.map((a) => (
                    <Link key={a.id} href={`/announcements`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-muted">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground bg-muted/50 flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
