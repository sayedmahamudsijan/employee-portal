"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { getRoleLabel, DEPARTMENTS } from "@/lib/roles";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  department: string | null;
  jobTitle: string | null;
  employeeId: string | null;
  createdAt: string;
};

const ALL_ROLES: Role[] = ["INTERN", "EMPLOYEE", "MANAGER", "ADMIN", "CEO", "CMO", "CTO"];

export function UserManagement({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmpId, setEditEmpId] = useState("");

  async function updateUser(id: string, data: Partial<Pick<User, "role" | "status" | "employeeId">>) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update user");
        return;
      }
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...data, ...(json.data?.employeeId && { employeeId: json.data.employeeId }) } : u)));
      toast.success("User updated");
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function removeUser(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((us) => us.filter((u) => u.id !== id));
      toast.success("User removed");
      setConfirmDelete(null);
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setDeleting(false);
    }
  }

  async function saveEmployeeId(user: User) {
    await updateUser(user.id, { employeeId: editEmpId.trim() || null } as any);
    setEditingId(null);
  }

  const pending = users.filter((u) => u.status === "PENDING");
  const active  = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            Pending Approvals
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-semibold flex items-center justify-center">
              {pending.length}
            </span>
          </h3>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 overflow-hidden divide-y divide-border">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10">
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(v) => updateUser(user.id, { role: v as Role })}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDelete(user)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users table */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All Users ({users.length})</h3>
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {active.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editEmpId}
                          onChange={(e) => setEditEmpId(e.target.value)}
                          className="h-7 text-xs w-32"
                          placeholder="MBD-AA-1001"
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEmployeeId(user)}>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-foreground">
                          {user.employeeId ?? <span className="text-muted-foreground">—</span>}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                          onClick={() => { setEditingId(user.id); setEditEmpId(user.employeeId ?? ""); }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={user.role}
                      onValueChange={(v) => updateUser(user.id, { role: v as Role })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.status === "ACTIVE" ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                          onClick={() => updateUser(user.id, { status: "INACTIVE" })}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary"
                          onClick={() => updateUser(user.id, { status: "ACTIVE" })}>
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        {confirmDelete && (
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove user?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirmDelete.name}</span> ({confirmDelete.email}) will be permanently removed. Their tasks and history remain but they won't be able to sign in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => removeUser(confirmDelete.id)} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
