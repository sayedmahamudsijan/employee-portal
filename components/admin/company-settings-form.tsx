"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

type Settings = {
  companyName: string;
  companyLogo: string | null;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  defaultCasualLeave: number;
  defaultSickLeave: number;
  defaultAnnualLeave: number;
  fiscalYearStart: string;
  currency: string;
  emailFromName: string;
  primaryColor: string;
};

const DAYS = [
  { v: 1, n: "Mon" }, { v: 2, n: "Tue" }, { v: 3, n: "Wed" },
  { v: 4, n: "Thu" }, { v: 5, n: "Fri" }, { v: 6, n: "Sat" }, { v: 0, n: "Sun" },
];

const TIMEZONES = [
  "Asia/Dhaka", "Asia/Kolkata", "Asia/Karachi", "Asia/Singapore",
  "Asia/Tokyo", "Asia/Dubai", "Europe/London", "Europe/Berlin",
  "America/New_York", "America/Chicago", "America/Los_Angeles", "UTC",
];

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR", "PKR", "AED", "SGD"];

export function CompanySettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(d: number) {
    set("workingDays", s.workingDays.includes(d)
      ? s.workingDays.filter((x) => x !== d)
      : [...s.workingDays, d].sort());
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Branding */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Branding</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input value={s.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Company Logo URL</Label>
            <Input value={s.companyLogo ?? ""} onChange={(e) => set("companyLogo", e.target.value || null)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label>Email From Name</Label>
            <Input value={s.emailFromName} onChange={(e) => set("emailFromName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Brand Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="w-14 h-10 p-1" />
              <Input value={s.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Working hours */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Working Hours & Timezone</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={s.timezone} onValueChange={(v) => set("timezone", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" value={s.workingHoursStart} onChange={(e) => set("workingHoursStart", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" value={s.workingHoursEnd} onChange={(e) => set("workingHoursEnd", e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="block mb-2">Working Days</Label>
          <div className="flex gap-1.5 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.v}
                type="button"
                onClick={() => toggleDay(d.v)}
                className={`text-xs px-3 py-1.5 rounded-md border ${
                  s.workingDays.includes(d.v)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leave defaults */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Default Leave Allocations (per year)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Casual</Label>
            <Input type="number" value={s.defaultCasualLeave} onChange={(e) => set("defaultCasualLeave", +e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sick</Label>
            <Input type="number" value={s.defaultSickLeave} onChange={(e) => set("defaultSickLeave", +e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Annual</Label>
            <Input type="number" value={s.defaultAnnualLeave} onChange={(e) => set("defaultAnnualLeave", +e.target.value)} />
          </div>
        </div>
      </div>

      {/* Fiscal & Currency */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Finance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fiscal Year Start (MM-DD)</Label>
            <Input value={s.fiscalYearStart} onChange={(e) => set("fiscalYearStart", e.target.value)} placeholder="01-01" />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={s.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
