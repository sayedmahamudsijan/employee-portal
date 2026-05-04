import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

type Review = {
  id: string;
  period: string;
  ratings: Record<string, number>;
  comments: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; image: string | null };
  cycle: { name: string } | null;
};

const CATEGORIES = ["Delivery", "Communication", "Initiative", "Teamwork", "Technical"];

export function MyReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Submitted performance reviews from your manager will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const ratings = review.ratings as Record<string, number>;
        const avg = Object.values(ratings).length > 0
          ? Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length
          : 0;

        return (
          <div key={review.id} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{review.cycle?.name ?? review.period}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{review.period}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{cat}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-3 h-3 rounded-sm ${
                          n <= (ratings[cat] ?? 0)
                            ? "bg-amber-400"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                      {ratings[cat] ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {review.comments && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Comments</p>
                <p className="text-sm text-foreground">{review.comments}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Avatar name={review.reviewer.name} src={review.reviewer.image} size="xs" />
              <span className="text-xs text-muted-foreground">
                Reviewed by {review.reviewer.name} · {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
