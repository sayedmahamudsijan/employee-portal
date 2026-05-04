"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/shared/avatar";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  role: string;
};

export function ProfileForm({ user, userId }: { user: User; userId: string }) {
  const [form, setForm] = useState({
    name: user.name,
    jobTitle: user.jobTitle ?? "",
    department: user.department ?? "",
    image: user.image ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <Avatar name={form.name} src={form.image || null} size="lg" />
          <div>
            <p className="text-sm font-medium text-foreground">{form.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Google Account (read-only)</Label>
            <Input className="mt-1 bg-muted" value={user.email} disabled />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Job Title</Label>
            <Input
              className="mt-1"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="e.g. Frontend Engineer"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Department</Label>
            <Input
              className="mt-1"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Profile Picture URL</Label>
            <Input
              className="mt-1"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
