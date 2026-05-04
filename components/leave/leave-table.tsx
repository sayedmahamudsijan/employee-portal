"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CalendarOff, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { LeaveStatus, LeaveType } from "@prisma/client";

type LeaveRequest = {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string | null;
  reviewNote: string | null;
  createdAt: string;
};

export function LeaveTable({ requests: initial }: { requests: LeaveRequest[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);

  async function cancel(id: string) {
    try {
      await fetch(`/api/leave/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setRequests((r) => r.map((req) => req.id === id ? { ...req, status: "CANCELLED" as LeaveStatus } : req));
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="No leave requests"
        description="Submit a leave request using the button above."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dates</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Days</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Note</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium capitalize">{req.type.toLowerCase()}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(req.startDate)} — {formatDate(req.endDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{req.days}d</td>
                <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-48 truncate">
                  {req.reviewNote ?? req.reason ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(req.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {req.status === "PENDING" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => cancel(req.id)}
                      aria-label="Cancel request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
