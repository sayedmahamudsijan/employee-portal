"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, AlertCircle } from "lucide-react";

export function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.status === "PENDING") {
        router.push("/pending");
      } else if (session?.user?.status === "ACTIVE") {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-primary/5" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              MBD Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Employee Operations Platform
            </p>
          </div>
        </div>

        {/* Sign in card */}
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your MBD account to continue
            </p>
          </div>

          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full gap-3 h-11"
            variant="outline"
          >
            <GoogleIcon />
            Sign in with Google
          </Button>

          {authError === "EmailNotAllowed" ? (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-left">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">
                Your email is not authorised to access this portal. Contact your administrator to request access.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Only authorised email addresses can sign in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
