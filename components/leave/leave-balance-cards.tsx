import { Progress } from "@/components/ui/progress";
import { CalendarOff } from "lucide-react";

interface LeaveBalance {
  casual: number;
  sick: number;
  annual: number;
}

const TOTALS = { casual: 12, sick: 10, annual: 15 };
const LABELS = { casual: "Casual", sick: "Sick", annual: "Annual" };
const COLORS = {
  casual: "text-blue-600 dark:text-blue-400",
  sick: "text-amber-600 dark:text-amber-400",
  annual: "text-green-600 dark:text-green-400",
};

export function LeaveBalanceCards({ balance }: { balance: LeaveBalance | null }) {
  const types = ["casual", "sick", "annual"] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {types.map((type) => {
        const remaining = balance?.[type] ?? TOTALS[type];
        const total = TOTALS[type];
        const used = total - remaining;
        return (
          <div key={type} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{LABELS[type]}</span>
              <CalendarOff className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-semibold ${COLORS[type]}`}>
              {remaining}
              <span className="text-sm font-normal text-muted-foreground">/{total}</span>
            </div>
            <Progress value={(used / total) * 100} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{used} used · {remaining} remaining</p>
          </div>
        );
      })}
    </div>
  );
}
