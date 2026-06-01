/**
 * MBD wordmark — Syne 800, white → orange-red → violet gradient,
 * tight tracking. Reusable everywhere a brand mark is needed.
 */

export interface MbdLogoProps {
  size?:    "sm" | "md" | "lg" | "xl";
  /** Show "META BUILD DYNAMICS" eyebrow above the wordmark */
  eyebrow?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
} as const;

export function MbdLogo({ size = "md", eyebrow = false, className }: MbdLogoProps) {
  return (
    <div className={["inline-flex flex-col items-start gap-1 select-none", className].filter(Boolean).join(" ")}>
      {eyebrow && (
        <span className="mbd-eyebrow">Meta Build Dynamics</span>
      )}
      <span
        className={`mbd-text-gradient font-[800] ${SIZES[size]}`}
        style={{
          fontFamily: "var(--font-syne), system-ui, sans-serif",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        MBD
      </span>
    </div>
  );
}
