"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, Clock, User, Mail,
  Building2, MessageSquare, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AccessRequest {
  id:         string;
  name:       string;
  email:      string;
  department: string | null;
  reason:     string | null;
  status:     RequestStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt:  string;
}

interface Props {
  initial: AccessRequest[];
}

const STATUS_BADGE: Record<RequestStatus, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  APPROVED: { label: "Approved", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  REJECTED: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

export function AccessRequestsManager({ initial }: Props) {
  const [requests, setRequests] = useState<AccessRequest[]>(initial);
  const [filter,   setFilter]   = useState<RequestStatus | "ALL">("PENDING");
  const [loading,  setLoading]  = useState<string | null>(null); // id of request being actioned
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const filtered = requests.filter((r) => filter === "ALL" || r.status === filter);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const action = async (id: string, act: "approve" | "reject") => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/access-requests/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: act, note: noteMap[id] ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed"); return; }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status:     act === "approve" ? "APPROVED" : "REJECTED",
                reviewNote: noteMap[id] ?? null,
                reviewedAt: new Date().toISOString(),
              }
            : r
        )
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit border border-border">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === f
                ? "bg-card border border-border shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "PENDING" && pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {filter === "PENDING" ? "No pending access requests." : `No ${filter.toLowerCase()} requests.`}
          </p>
        </div>
      )}

      {/* Request cards */}
      <div className="space-y-3">
        {filtered.map((req) => {
          const isPending = req.status === "PENDING";
          const isExpanded = expanded[req.id];
          const isActioning = loading === req.id;
          const { label, className } = STATUS_BADGE[req.status];

          return (
            <div
              key={req.id}
              className={cn(
                "border border-border rounded-xl bg-card overflow-hidden transition-all",
                isPending && "border-yellow-500/20"
              )}
            >
              {/* Card header */}
              <div className="flex items-start gap-3 p-4">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground font-semibold text-sm">
                  {req.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{req.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", className)}>
                      {label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {req.email}
                    </span>
                    {req.department && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" /> {req.department}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Requested {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(req.id)}
                  className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded detail + actions */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                  {/* Reason */}
                  {req.reason && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">{req.reason}</p>
                    </div>
                  )}

                  {/* Reviewed note (non-pending) */}
                  {!isPending && req.reviewNote && (
                    <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Admin note: </span>
                      {req.reviewNote}
                    </div>
                  )}

                  {/* Actions for pending */}
                  {isPending && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={noteMap[req.id] ?? ""}
                        onChange={(e) => setNoteMap((m) => ({ ...m, [req.id]: e.target.value }))}
                        placeholder="Optional note (visible in review log)…"
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => action(req.id, "approve")}
                          disabled={isActioning}
                          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isActioning
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />
                          }
                          Approve &amp; Whitelist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => action(req.id, "reject")}
                          disabled={isActioning}
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
