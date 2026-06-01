"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { MbdThemeSwitcher } from "@/components/brand/theme-switcher";
import { MbdCursor }        from "@/components/brand/mbd-cursor";
import { MbdClickBurst }    from "@/components/brand/click-burst";
import { MbdScrollReveal }  from "@/components/brand/scroll-reveal";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Brand-layer enhancements — all are no-ops on touch/reduced-motion */}
          <MbdScrollReveal />
          <MbdCursor />
          <MbdClickBurst />
          <MbdThemeSwitcher />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
