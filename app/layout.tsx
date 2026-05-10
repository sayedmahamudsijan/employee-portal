import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { getCompanySettings } from "@/lib/company-settings";
import { parseDesignConfig } from "@/lib/portal-design";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getCompanySettings();
    const design   = parseDesignConfig(settings.designConfig);
    const title    = design.portalTitle ?? settings.companyName ?? "MBD Portal";
    return {
      title,
      description: `${title} — Employee Operations Portal`,
      icons: design.faviconUrl ? { icon: design.faviconUrl } : undefined,
    };
  } catch {
    return { title: "MBD Portal", description: "Employee Operations Portal" };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Inject primary color as a CSS custom property so the whole app
  // picks it up without a client-side round trip.
  let primaryColor = "#3b82f6";
  try {
    const settings = await getCompanySettings();
    const design   = parseDesignConfig(settings.designConfig);
    primaryColor   = design.primaryColor ?? settings.primaryColor ?? "#3b82f6";
  } catch { /* use default */ }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Inject the brand color as CSS custom properties.
      // --portal-primary is used by the sidebar logo area and design-aware components.
      style={{ "--portal-primary": primaryColor } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
