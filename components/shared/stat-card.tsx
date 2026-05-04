import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  color?: "default" | "green" | "amber" | "red" | "blue";
  className?: string;
}

const colorMap = {
  default: "text-foreground",
  green: "text-green-600 dark:text-green-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-primary",
};

export function StatCard({ label, value, icon: Icon, trend, color = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-semibold", colorMap[color])}>{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground">{trend.label}</p>
      )}
    </div>
  );
}
