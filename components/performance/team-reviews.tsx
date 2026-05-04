"use client";

import { useState } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { Users, CheckCircle, Edit2 } from "lucide-react";

type Report = {
  id: string;
  name: string;
  image: string | null;
  jobTitle: string | null;
  reviews: { id: string; submitted: boolean; period: string }[];
};

const CATEGORIES = ["Delivery", "Communication", "Initiative", "Teamwork", "Technical"];
const CURRENT_PERIOD = `Q2 ${new Date().getFullYear()}`;

export function TeamReviews({ reports, reviewerId }: { reports: Report[]; reviewerId: string }) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  if (reports.length === 0) {
    return <EmptyState icon={Users} title="No direct reports" description="You have no direct reports assigned." />;
  }

  async function openReview(report: Report) {
    setSelectedReport(report);
    const existing = report.reviews[0];
    if (existing) {
      setReviewId(existing.id);
      const res = await fetch(`/api/reviews?subjectId=${report.id}`);
      const { data } = await res.json();
      const r = data?.find((x: any) => x.id === existing.id);
      if (r) {
        setRatings((r.ratings as Record<string, number>) ?? {});
        setComments(r.comments ?? "");
      }
    } else {
      setReviewId(null);
      setRatings({});
      setComments("");
    }
  }

  async function save(submit: boolean) {
    if (!selectedReport) return;
    setSaving(true);
    try {
      let id = reviewId;
      if (!id) {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectId: selectedReport.id, period: CURRENT_PERIOD }),
        });
        const { data } = await res.json();
        id = data.id;
        setReviewId(id);
      }
      await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings, comments, submitted: submit }),
      });
      toast.success(submit ? "Review submitted" : "Draft saved");
      if (submit) setSelectedReport(null);
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {reports.map((report) => {
          const latest = report.reviews[0];
          const isSubmitted = latest?.submitted;
          return (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
            >
              <Avatar name={report.name} src={report.image} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{report.name}</p>
                <p className="text-xs text-muted-foreground">{report.jobTitle ?? "Employee"}</p>
              </div>
              <div className="flex items-center gap-3">
                {isSubmitted ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Submitted
                  </span>
                ) : latest ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Draft saved</span>
                ) : null}
                <Button
                  size="sm"
                  variant={isSubmitted ? "outline" : "default"}
                  className="gap-1.5"
                  onClick={() => openReview(report)}
                >
                  {isSubmitted ? (
                    <><Edit2 className="w-3.5 h-3.5" />View</>
                  ) : latest ? (
                    <><Edit2 className="w-3.5 h-3.5" />Continue</>
                  ) : (
                    "Start Review"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        {selectedReport && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Performance Review — {selectedReport.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground">{CURRENT_PERIOD}</p>

              {CATEGORIES.map((cat) => (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">{cat}</label>
                    <span className="text-sm font-semibold text-primary w-6 text-center">
                      {ratings[cat] ?? 0}
                    </span>
                  </div>
                  <Slider
                    value={[ratings[cat] ?? 0]}
                    onValueChange={(v) => {
                      const val = Array.isArray(v) ? (v as number[])[0] : (v as number);
                      setRatings((r) => ({ ...r, [cat]: val }));
                    }}
                    min={0}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Comments</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Add overall feedback..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => save(false)} disabled={saving}>
                  Save Draft
                </Button>
                <Button onClick={() => save(true)} disabled={saving}>
                  {saving ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
