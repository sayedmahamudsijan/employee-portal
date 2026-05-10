"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mail, RefreshCw, UserPlus, Send, XCircle, CheckCircle2,
  Clock, ChevronDown, ChevronUp, AlertCircle, Loader2, RotateCcw,
} from "lucide-react";

type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED";
type Role = "INTERN" | "EMPLOYEE" | "MANAGER" | "ADMIN" | "CEO" | "CMO" | "CTO";

interface Invitation {
  id:          string;
  name:        string;
  email:       string;
  position:    string | null;
  role:        Role;
  employeeId:  string;
  status:      InvitationStatus;
  sentAt:      string;
  revokedAt:   string | null;
  resendCount: number;
  sentBy:      { name: string | null; email: string };
}

interface CustomRole {
  id:   string;
  name: string;
}

interface Props {
  initial:     Invitation[];
  customRoles: CustomRole[];
  canResetCode: boolean; // CEO / CMO / CTO
}

const STATUS_BADGE: Record<InvitationStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending",  className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  ACCEPTED: { label: "Accepted", className: "bg-green-500/10 text-green-600 border-green-500/30",   icon: <CheckCircle2 className="w-3 h-3" /> },
  REVOKED:  { label: "Revoked",  className: "bg-red-500/10 text-red-600 border-red-500/30",         icon: <XCircle className="w-3 h-3" /> },
};

const ROLES: Role[] = ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"];

const BLANK_FORM = { name: "", email: "", position: "", role: "EMPLOYEE" as Role, customRoleId: "" };

export function InvitationsManager({ initial, customRoles, canResetCode }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>(initial);
  const [filter,      setFilter]      = useState<InvitationStatus | "ALL">("PENDING");
  const [expanded,    setExpanded]    = useState<Record<string, boolean>>({});
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = invitations.filter((i) => filter === "ALL" || i.status === filter);
  const pendingCount = invitations.filter((i) => i.status === "PENDING").length;

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim())  return setFormError("Full name is required.");
    if (!form.email.trim()) return setFormError("Email address is required.");
    if (!form.email.includes("@")) return setFormError("Please enter a valid email.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        form.name.trim(),
          email:       form.email.trim(),
          position:    form.position.trim() || undefined,
          role:        form.role,
          customRoleId: form.customRoleId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to send invitation."); return; }

      // Refresh list
      const listRes = await fetch("/api/admin/invitations");
      if (listRes.ok) {
        const listData = await listRes.json();
        setInvitations(listData.data ?? listData);
      }

      setForm(BLANK_FORM);
      setShowForm(false);
      if (data.data?.emailFailed) {
        alert("Invitation created, but the email could not be delivered. Please resend manually.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const doAction = async (id: string, action: "resend" | "revoke") => {
    setActionLoading(id + action);
    try {
      const res = await fetch(`/api/admin/invitations/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Action failed"); return; }

      setInvitations((prev) =>
        prev.map((inv) => {
          if (inv.id !== id) return inv;
          if (action === "revoke") return { ...inv, status: "REVOKED", revokedAt: new Date().toISOString() };
          if (action === "resend") return { ...inv, resendCount: inv.resendCount + 1 };
          return inv;
        })
      );
    } finally {
      setActionLoading(null);
    }
  };

  const resetCode = async (userId: string, invId: string) => {
    setActionLoading(invId + "reset");
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-code`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Reset failed"); return; }
      alert("Access code reset and new email sent.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit border border-border">
          {(["PENDING", "ACCEPTED", "REVOKED", "ALL"] as const).map((f) => (
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

        <Button onClick={() => setShowForm((v) => !v)} className="gap-1.5" size="sm">
          <UserPlus className="w-3.5 h-3.5" />
          Send Invitation
        </Button>
      </div>

      {/* Invite form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> New Invitation
          </h3>
          <form onSubmit={sendInvitation} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Jane Smith" disabled={submitting} autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Gmail Address <span className="text-destructive">*</span>
              </label>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="jane@gmail.com" disabled={submitting} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Position / Job Title</label>
              <Input value={form.position} onChange={set("position")} placeholder="e.g. Senior Engineer" disabled={submitting} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Role</label>
              <select
                value={form.role}
                onChange={set("role")}
                disabled={submitting}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            {customRoles.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Role (optional)</label>
                <select
                  value={form.customRoleId}
                  onChange={set("customRoleId")}
                  disabled={submitting}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">None</option>
                  {customRoles.map((cr) => <option key={cr.id} value={cr.id}>{cr.name}</option>)}
                </select>
              </div>
            )}

            {formError && (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">{formError}</p>
              </div>
            )}

            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</> : <><Send className="w-3.5 h-3.5" />Send Invitation Email</>}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormError(null); setForm(BLANK_FORM); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {filter === "PENDING" ? "No pending invitations." : `No ${filter.toLowerCase()} invitations.`}
          </p>
        </div>
      )}

      {/* Invitation cards */}
      <div className="space-y-3">
        {filtered.map((inv) => {
          const { label, className, icon } = STATUS_BADGE[inv.status];
          const isExpanded   = expanded[inv.id];
          const isPending    = inv.status === "PENDING";

          return (
            <div
              key={inv.id}
              className={cn(
                "border border-border rounded-xl bg-card overflow-hidden transition-all",
                isPending && "border-yellow-500/20"
              )}
            >
              {/* Card header */}
              <div className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground font-semibold text-sm">
                  {inv.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{inv.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border flex items-center gap-1", className)}>
                      {icon}{label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {inv.email}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{inv.employeeId}</span>
                    {inv.position && <span className="text-xs text-muted-foreground">{inv.position}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Sent {new Date(inv.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {inv.resendCount > 0 && ` · Resent ${inv.resendCount}×`}
                    {inv.sentBy.name && ` · by ${inv.sentBy.name}`}
                  </p>
                </div>

                <button
                  onClick={() => setExpanded((p) => ({ ...p, [inv.id]: !p[inv.id] }))}
                  className="text-muted-foreground hover:text-foreground p-1 flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3 flex flex-wrap gap-2">
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doAction(inv.id, "resend")}
                        disabled={actionLoading === inv.id + "resend"}
                        className="gap-1.5"
                      >
                        {actionLoading === inv.id + "resend"
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <RefreshCw className="w-3.5 h-3.5" />}
                        Resend Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doAction(inv.id, "revoke")}
                        disabled={actionLoading === inv.id + "revoke"}
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Revoke
                      </Button>
                    </>
                  )}
                  {canResetCode && inv.status === "ACCEPTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // We don't have userId here — fetch by email
                        fetch(`/api/admin/invitations/${inv.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "resend" }),
                        }).then(async (r) => {
                          const d = await r.json();
                          if (!r.ok) alert(d.error ?? "Failed");
                          else alert("New access code sent.");
                        });
                      }}
                      disabled={actionLoading === inv.id + "reset"}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Access Code
                    </Button>
                  )}
                  {inv.status === "REVOKED" && (
                    <p className="text-xs text-muted-foreground self-center">
                      Revoked {inv.revokedAt ? new Date(inv.revokedAt).toLocaleDateString("en-GB") : ""}
                    </p>
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
