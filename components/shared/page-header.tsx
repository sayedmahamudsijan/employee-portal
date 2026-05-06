import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: Props) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border", className)}>
      <div>
        <h1 className="text-2xl font-bold gradient-text">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
