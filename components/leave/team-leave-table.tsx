"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import type { LeaveStatus, LeaveType } from "@prisma/client";

type Request = {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  user: { id: string; name: string; image: string | null; email: string };
};

export function TeamLeaveTable({ requests: initial }: { requests: Request[] }) {
  const [requests, setRequests] = useState(initial);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: "approve" | "reject", note?: string) {
    if (selected.size === 0) return toast.error("Select requests first");
    try {
      const res = await fetch("/api/admin/bulk/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const status = action === "approve" ? "APPROVED" : "REJECTED";
      setRequests((r) => r.map((req) => (selected.has(req.id) ? { ...req, status } : req)));
      toast.success(`${json.data.count} request(s) ${action === "approve" ? "approved" : "rejected"}`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function updateStatus(id: string, status: "APPROVED" | "REJECTED", note?: string) {
    try {
      const res = await fetch(`/api/leave/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      });
      if (!res.ok) throw new Error();
      setRequests((r) =>
        r.map((req) =>
          req.id === id ? { ...req, status } : req
        )
      );
      toast.success(status === "APPROVED" ? "Request approved" : "Request rejected");
    } catch {
      toast.error("Failed to update request");
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");

  if (pending.length === 0) {
    return (
      <EmptyState icon={Users} title="No pending requests" description="All leave requests have been reviewed." />
    );
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">{selected.size} selected</p>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={() => bulkAction("approve")}>
              <CheckCircle className="w-3.5 h-3.5" /> Approve all
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => bulkAction("reject")}>
              <XCircle className="w-3.5 h-3.5" /> Reject all
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelected(new Set())}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 w-8">
                <Checkbox
                  checked={selected.size > 0 && selected.size === pending.length}
                  onCheckedChange={(v) => setSelected(v ? new Set(pending.map((r) => r.id)) : new Set())}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pending.map((req) => (
              <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Checkbox checked={selected.has(req.id)} onCheckedChange={() => toggle(req.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={req.user.name} src={req.user.image} size="sm" />
                    <div>
                      <p className="font-medium text-foreground">{req.user.name}</p>
                      <p className="text-xs text-muted-foreground">{req.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{req.type.toLowerCase()}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(req.startDate)} — {formatDate(req.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{req.days}d</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">
                  {req.reason ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-7"
                      onClick={() => updateStatus(req.id, "APPROVED")}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-7"
                      onClick={() => { setRejectModal({ id: req.id }); setRejectNote(""); }}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (rejectModal) updateStatus(rejectModal.id, "REJECTED", rejectNote);
                  setRejectModal(null);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
