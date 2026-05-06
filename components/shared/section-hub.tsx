import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import type { LucideIcon } from "lucide-react";

export interface HubItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  gradient?: string;
}

interface Props {
  title: string;
  description?: string;
  items: HubItem[];
}

const GRADIENTS = [
  "gradient-brand",
  "gradient-success",
  "gradient-warning",
  "gradient-info",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-sky-500",
];

export function SectionHub({ title, description, items }: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => {
          const gradClass = item.gradient ?? GRADIENTS[idx % GRADIENTS.length];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group rounded-xl card-festive p-6 flex flex-col gap-5 transition-all duration-200",
                "hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/20"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg text-white flex-shrink-0",
                  gradClass
                )}
              >
                <item.icon className="w-7 h-7" />
              </div>

              {/* Text */}
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                  {item.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              {/* Arrow indicator */}
              <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -mt-2">
                Open →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
