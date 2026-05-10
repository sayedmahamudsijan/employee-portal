"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type View = "signin" | "request" | "success";

export function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [view, setView] = useState<View>("signin");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.status === "PENDING") router.push("/pending");
      else if (session?.user?.status === "ACTIVE")  router.push("/dashboard");
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

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center w-full max-w-sm">
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

        {/* Card — animates between views */}
        <div className="w-full rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Sign-in view */}
          <div
            className={cn(
              "p-8 flex flex-col gap-6 transition-all duration-300",
              view !== "signin" && "hidden"
            )}
          >
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Welcome back</h2>
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
                  Your email is not authorised. Contact your administrator or request access below.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Only authorised email addresses can sign in.
              </p>
            )}

            {/* Request access link */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Don&apos;t have access yet?</p>
              <button
                onClick={() => setView("request")}
                className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                Request Account Access →
              </button>
            </div>
          </div>

          {/* Request access form */}
          {view === "request" && (
            <RequestAccessForm
              onBack={() => setView("signin")}
              onSuccess={() => setView("success")}
            />
          )}

          {/* Success view */}
          {view === "success" && (
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Request Submitted</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Your access request has been sent to the admin team. You&apos;ll be able to sign in once it&apos;s approved.
                </p>
              </div>
              <button
                onClick={() => setView("signin")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request Access Form ────────────────────────────────────────────────────

function RequestAccessForm({
  onBack,
  onSuccess,
}: {
  onBack:    () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name:       "",
    email:      "",
    department: "",
    reason:     "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!form.name.trim())  return setFieldError("Please enter your full name.");
    if (!form.email.trim()) return setFieldError("Please enter your work email.");
    if (!form.email.includes("@")) return setFieldError("Please enter a valid email address.");

    setSubmitting(true);
    try {
      const res  = await fetch("/api/auth/request-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFieldError(data.error ?? "Failed to submit. Please try again.");
        return;
      }
      onSuccess();
    } catch {
      setFieldError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-left">Request Access</h2>
          <p className="text-sm text-muted-foreground mt-0.5 text-left">
            Fill in your details and an admin will review your request.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Jane Smith"
            disabled={submitting}
            autoFocus
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Work Email <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="jane@company.com"
            disabled={submitting}
          />
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Department <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <Input
            value={form.department}
            onChange={set("department")}
            placeholder="e.g. Marketing"
            disabled={submitting}
          />
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Reason / Message <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <textarea
            value={form.reason}
            onChange={set("reason")}
            placeholder="Why do you need access? Any additional context..."
            disabled={submitting}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Error */}
        {fieldError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{fieldError}</p>
          </div>
        )}

        <Button type="submit" className="w-full h-11 mt-1" disabled={submitting}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
          ) : (
            "Submit Request"
          )}
        </Button>
      </form>
    </div>
  );
}

// ── Google Icon ────────────────────────────────────────────────────────────

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
