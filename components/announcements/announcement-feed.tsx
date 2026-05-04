"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, timeAgo } from "@/lib/utils";
import { Megaphone, Pin, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; image: string | null };
};

export function AnnouncementFeed({
  announcements: initial,
  canManage,
}: {
  announcements: Announcement[];
  canManage: boolean;
}) {
  const [announcements, setAnnouncements] = useState(initial);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const pinned = announcements.filter((a) => a.pinned);
  const feed = announcements.filter((a) => !a.pinned);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteAnnouncement(id: string) {
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      setAnnouncements((a) => a.filter((x) => x.id !== id));
      toast.success("Announcement deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (announcements.length === 0) {
    return (
      <EmptyState icon={Megaphone} title="No announcements yet" description="Posts from managers and HR will appear here." />
    );
  }

  return (
    <>
      {pinned.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" /> Pinned
          </p>
          {pinned.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              canManage={canManage}
              isExpanded={expanded.has(a.id)}
              onToggle={() => toggleExpand(a.id)}
              onOpen={() => setSelected(a)}
              onDelete={() => deleteAnnouncement(a.id)}
              pinned
            />
          ))}
        </div>
      )}

      {feed.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent</p>
          )}
          {feed.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              canManage={canManage}
              isExpanded={expanded.has(a.id)}
              onToggle={() => toggleExpand(a.id)}
              onOpen={() => setSelected(a)}
              onDelete={() => deleteAnnouncement(a.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.body}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Avatar name={selected.author.name} src={selected.author.image} size="xs" />
                <span className="text-xs text-muted-foreground">
                  {selected.author.name} · {formatDate(selected.createdAt)}
                </span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function AnnouncementCard({
  announcement: a,
  canManage,
  isExpanded,
  onToggle,
  onOpen,
  onDelete,
  pinned = false,
}: {
  announcement: Announcement;
  canManage: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  pinned?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 space-y-3 ${pinned ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {pinned && (
              <span className="text-xs font-medium text-primary">Pinned</span>
            )}
            <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
          </div>
          <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>
            {a.body}
          </p>
          {a.body.length > 180 && (
            <button
              className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5"
              onClick={onToggle}
            >
              {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
        </div>
        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={onDelete}
            aria-label="Delete announcement"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Avatar name={a.author.name} src={a.author.image} size="xs" />
        <span className="text-xs text-muted-foreground">
          {a.author.name} · {timeAgo(a.createdAt)}
        </span>
      </div>
    </div>
  );
}
