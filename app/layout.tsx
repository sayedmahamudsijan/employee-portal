import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { getCompanySettings } from "@/lib/company-settings";
import { parseDesignConfig } from "@/lib/portal-design";

// ─── MBD Typography ──────────────────────────────────────────────────────────
// Syne 800 → display / headings
// DM Sans → body
// DM Mono → labels, eyebrows, code
const syne = Syne({
  subsets: ["latin"],
  weight:  ["700", "800"],
  variable: "--font-syne",
  display:  "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight:  ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display:  "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight:  ["400", "500"],
  variable: "--font-dm-mono",
  display:  "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getCompanySettings();
    const design   = parseDesignConfig(settings.designConfig);
    const title    = design.portalTitle ?? settings.companyName ?? "MBD Portal";
    return {
      title,
      description: `${title} — We Build. We Design. We Innovate.`,
      icons: design.faviconUrl ? { icon: design.faviconUrl } : undefined,
    };
  } catch {
    return { title: "MBD Portal", description: "We Build. We Design. We Innovate." };
  }
}

// Viewport-fit=cover so the safe-area-inset CSS in globals.css actually fires.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060611",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Pull the operator-configured primary colour for legacy components that
  // still reference --portal-primary. The MBD palette uses its own tokens.
  let primaryColor = "#ff4d1c";
  try {
    const settings = await getCompanySettings();
    const design   = parseDesignConfig(settings.designConfig);
    primaryColor   = design.primaryColor ?? settings.primaryColor ?? "#ff4d1c";
  } catch { /* default to MBD orange */ }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`dark ${syne.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      style={{ "--portal-primary": primaryColor } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground theme-fade">
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
