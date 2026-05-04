"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { calcWorkingDays } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LeaveRequestModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ type: "CASUAL", startDate: "", endDate: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const workingDays =
    form.startDate && form.endDate
      ? calcWorkingDays(new Date(form.startDate), new Date(form.endDate))
      : 0;

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return toast.error("Start and end dates are required");
    if (new Date(form.startDate) > new Date(form.endDate)) return toast.error("Start must be before end date");
    setLoading(true);
    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, days: workingDays }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed");
      }
      toast.success("Leave request submitted");
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <Select value={form.type} onValueChange={(v) => update("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["CASUAL", "SICK", "ANNUAL", "UNPAID"].map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} required />
            </div>
          </div>

          {workingDays > 0 && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
              <span className="font-semibold text-foreground">{workingDays}</span> working day{workingDays !== 1 ? "s" : ""}
            </p>
          )}

          <Textarea
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || workingDays === 0}>
              {loading ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
