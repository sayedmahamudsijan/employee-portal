"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Role, UserStatus } from "@prisma/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  department: string | null;
  jobTitle: string | null;
  createdAt: string;
};

export function UserManagement({ users: initial }: { users: User[] }) {
  const [users, setUsers] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function updateUser(id: string, data: Partial<Pick<User, "role" | "status">>) {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...data } : u)));
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

  const pending = users.filter((u) => u.status === "PENDING");
  const active = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            Pending Approvals
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold flex items-center justify-center">
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
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                >
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All Users ({users.length})</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
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
                    <Select
                      value={user.role}
                      onValueChange={(v) => updateUser(user.id, { role: v as Role })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => updateUser(user.id, { status: "INACTIVE" })}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary"
                          onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
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

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        {confirmDelete && (
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove user?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirmDelete.name}</span> ({confirmDelete.email}) will be permanently removed from the portal. Their tasks and history will remain but they won't be able to sign in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => removeUser(confirmDelete.id)}
                disabled={deleting}
              >
                {deleting ? "Removing…" : "Remove"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
