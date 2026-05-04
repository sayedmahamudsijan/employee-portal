import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 bg-muted rounded-md animate-pulse", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 space-y-3", className)}>
      <SkeletonLine className="w-1/3 h-3" />
      <SkeletonLine className="w-1/2 h-7" />
      <SkeletonLine className="w-2/3 h-3" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-1/3" />
        <SkeletonLine className="w-1/4 h-3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <SkeletonLine className="w-4 h-4" />
          <SkeletonLine className="flex-1" />
          <SkeletonLine className="w-16 h-5" />
          <SkeletonLine className="w-20 h-3" />
        </div>
      ))}
    </div>
  );
}
