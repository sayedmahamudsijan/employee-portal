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

const valueColor = {
  default: "gradient-text",
  green: "text-green-600 dark:text-green-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-primary",
};

const iconBg = {
  default: "gradient-brand text-white",
  green: "gradient-success text-white",
  amber: "gradient-warning text-white",
  red: "bg-red-500 text-white",
  blue: "gradient-info text-white",
};

export function StatCard({ label, value, icon: Icon, trend, color = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl card-festive p-6 flex flex-col gap-3 transition hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shadow-sm", iconBg[color])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={cn("text-3xl font-bold", valueColor[color])}>{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground">{trend.label}</p>
      )}
    </div>
  );
}
