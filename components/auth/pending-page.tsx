"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, Building2 } from "lucide-react";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function PendingApprovalPage({ user }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Pending Approval
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Hi {user.name?.split(" ")[0] ?? "there"}, your account is awaiting
              admin approval. You&apos;ll receive access once an administrator
              activates your account.
            </p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-border bg-card p-4 text-left">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-card-foreground mt-0.5">
            {user.email}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
