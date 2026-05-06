"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Save, TrendingUp, Target as TargetIcon, Sparkles } from "lucide-react";

type Level = {
  id: string;
  track: string;
  level: number;
  title: string;
  description: string | null;
  expectations: any;
};

type Profile = {
  track: string | null;
  currentLevel: number | null;
  targetLevel: number | null;
  targetDate: string | null;
  developmentPlan: string | null;
  achievements: any[];
};

export function CareerProfileView({ initial, levels, userId }: { initial: Profile | null; levels: Level[]; userId: string }) {
  const [profile, setProfile] = useState<Profile>(initial ?? { track: null, currentLevel: null, targetLevel: null, targetDate: null, developmentPlan: null, achievements: [] });
  const [saving, setSaving] = useState(false);

  const tracks = useMemo(() => Array.from(new Set(levels.map((l) => l.track))), [levels]);
  const trackLevels = useMemo(() => levels.filter((l) => l.track === profile.track).sort((a, b) => a.level - b.level), [levels, profile.track]);

  const currentLevelObj = trackLevels.find((l) => l.level === profile.currentLevel);
  const targetLevelObj = trackLevels.find((l) => l.level === profile.targetLevel);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/career/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No career tracks defined yet. An admin can set up tracks via the API.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Track selector */}
      <div className="rounded-2xl gradient-brand-soft border border-border p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Career Track</label>
          <Select value={profile.track ?? ""} onValueChange={(v) => setProfile({ ...profile, track: v, currentLevel: null, targetLevel: null })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Choose your track" /></SelectTrigger>
            <SelectContent>{tracks.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {profile.track && trackLevels.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Current Level</label>
              <Select value={profile.currentLevel?.toString() ?? ""} onValueChange={(v) => setProfile({ ...profile, currentLevel: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{trackLevels.map((l) => <SelectItem key={l.id} value={l.level.toString()}>L{l.level} — {l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target Level</label>
              <Select value={profile.targetLevel?.toString() ?? ""} onValueChange={(v) => setProfile({ ...profile, targetLevel: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{trackLevels.map((l) => <SelectItem key={l.id} value={l.level.toString()}>L{l.level} — {l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {profile.targetLevel && (
          <div>
            <label className="text-xs text-muted-foreground">Target Date</label>
            <Input type="date" value={profile.targetDate ? profile.targetDate.slice(0, 10) : ""} onChange={(e) => setProfile({ ...profile, targetDate: e.target.value })} />
          </div>
        )}
      </div>

      {/* Visual ladder */}
      {profile.track && trackLevels.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> {profile.track} Career Ladder
          </h3>
          <div className="space-y-2">
            {trackLevels.map((l) => {
              const isCurrent = l.level === profile.currentLevel;
              const isTarget = l.level === profile.targetLevel;
              const isPast = profile.currentLevel != null && l.level < profile.currentLevel;
              return (
                <div
                  key={l.id}
                  className={`rounded-lg p-3 border-2 transition ${
                    isCurrent ? "border-primary gradient-brand-soft" :
                    isTarget ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10" :
                    isPast ? "border-border bg-muted/30 opacity-60" :
                    "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold w-8">L{l.level}</span>
                    <span className="font-medium">{l.title}</span>
                    {isCurrent && <span className="ml-auto text-[10px] uppercase font-semibold gradient-brand text-white px-1.5 py-0.5 rounded">You are here</span>}
                    {isTarget && <span className="ml-auto text-[10px] uppercase font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded">Target</span>}
                  </div>
                  {l.description && <p className="text-xs text-muted-foreground mt-1 ml-10">{l.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Development plan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <TargetIcon className="w-4 h-4" /> Development Plan
        </h3>
        <Textarea
          placeholder="What skills, projects, or experiences will get you to your target level?"
          value={profile.developmentPlan ?? ""}
          onChange={(e) => setProfile({ ...profile, developmentPlan: e.target.value })}
          rows={6}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gradient-brand text-white border-0">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
