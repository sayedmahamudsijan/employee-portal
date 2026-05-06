import { cn, getInitials, avatarColor } from "@/lib/utils";
import Image from "next/image";

export type OnlineStatus = "online" | "away" | "offline";

interface Props {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: OnlineStatus;   // shows coloured dot if provided
  className?: string;
}

const sizes = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

// Dot size/position tuned per avatar size
const dotSizes = {
  xs: "w-1.5 h-1.5 -bottom-px -right-px border",
  sm: "w-2 h-2 bottom-0 right-0 border",
  md: "w-2.5 h-2.5 bottom-0 right-0 border-[1.5px]",
  lg: "w-3 h-3 bottom-0.5 right-0.5 border-2",
  xl: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2",
};

const statusColor: Record<OnlineStatus, string> = {
  online:  "bg-green-500",
  away:    "bg-amber-400",
  offline: "bg-zinc-400",
};

export function Avatar({ name, src, size = "md", status, className }: Props) {
  const initials   = getInitials(name);
  const colorClass = avatarColor(name);

  const dot = status ? (
    <span
      className={cn(
        "absolute rounded-full border-background",
        dotSizes[size],
        statusColor[status]
      )}
      aria-label={status}
    />
  ) : null;

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-visible flex-shrink-0", className)}>
        <div className={cn("relative rounded-full overflow-hidden", sizes[size])}>
          <Image src={src} alt={name} fill className="object-cover" sizes="64px" />
        </div>
        {dot}
      </div>
    );
  }

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold text-white",
          colorClass,
          sizes[size],
        )}
        aria-label={name}
      >
        {initials}
      </div>
      {dot}
    </div>
  );
}
