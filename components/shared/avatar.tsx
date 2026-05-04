import { cn, getInitials, avatarColor } from "@/lib/utils";
import Image from "next/image";

interface Props {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({ name, src, size = "md", className }: Props) {
  const initials = getInitials(name);
  const colorClass = avatarColor(name);

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size], className)}>
        <Image src={src} alt={name} fill className="object-cover" sizes="48px" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0",
        colorClass,
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
