"use client";

import type { Session } from "next-auth";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Heartbeat } from "@/components/layout/heartbeat";

interface Props {
  session: Session;
  children: React.ReactNode;
}

export function AppShell({ session, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={session.user.role}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          session={session}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile nav */}
      <MobileNav role={session.user.role} />

      {/* Background heartbeat — keeps lastSeenAt fresh */}
      <Heartbeat />
    </div>
  );
}
