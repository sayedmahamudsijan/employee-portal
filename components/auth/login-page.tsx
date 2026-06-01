"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MbdLogo } from "@/components/brand/mbd-logo";

type View = "signin" | "request" | "success";

/**
 * MBD Login page — the brand surface.
 *
 * Dark-space backdrop with mesh-gradient ambient, eyebrow → fluid display
 * headline → manifesto line → chamfered "Sign in with Google" CTA →
 * subtle stat strip. The whole page uses MBD design tokens so it retints
 * automatically when the mood theme switches in the top-right.
 */
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
        <div className="animate-pulse w-10 h-10 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* ── Ambient mesh-gradient + grid ───────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
        {/* Slow-rotating conic glow */}
        <div
          className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[140vw] h-[140vw] opacity-50"
          style={{
            background: "conic-gradient(from 200deg at 50% 50%, transparent 0deg, rgba(91,47,255,0.18) 90deg, transparent 180deg, rgba(255,77,28,0.18) 280deg, transparent 360deg)",
            filter: "blur(60px)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
          }}
        />
      </div>

      {/* ── Top brand bar ──────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <MbdLogo size="md" />
        <div className="hidden md:flex items-center gap-2 mbd-eyebrow">
          Dhaka · Bangladesh
        </div>
      </header>

      {/* ── Main column ────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 grid place-items-center px-6 py-8">
        <div className="w-full max-w-5xl grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">

          {/* Manifesto / left rail */}
          <section className="mbd-reveal flex flex-col gap-6 text-left">
            <span className="mbd-eyebrow">Employee Operations · Internal</span>
            <h1 className="mbd-display">
              We Build.<br />
              We Design.<br />
              <span className="mbd-text-gradient">We Innovate.</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/70 max-w-xl leading-relaxed">
              The MBD portal is the secure operating system for our team —
              design, software, AI, SQA, and academic research, all under one roof.
            </p>

            {/* Stat strip — meta about the portal, not the user */}
            <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
              <Stat eyebrow="Disciplines" value="05" />
              <Stat eyebrow="Continents" value="03" />
              <Stat eyebrow="Uptime"     value="99.9%" />
            </div>
          </section>

          {/* Auth card / right rail */}
          <section className="mbd-reveal w-full max-w-md justify-self-end">
            <div className="mbd-card p-7 md:p-8 flex flex-col gap-6">
              {/* Sign-in view */}
              <div className={cn("flex flex-col gap-6", view !== "signin" && "hidden")}>
                <div>
                  <span className="mbd-eyebrow">Welcome back</span>
                  <h2 className="mbd-display-sm mt-2">Access the Portal.</h2>
                  <p className="text-sm text-foreground/60 mt-2">
                    Sign in with your authorised Google account to continue.
                  </p>
                </div>

                <button
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="mbd-btn w-full"
                  data-cursor="hover"
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>

                {authError && (
                  <ErrorPill
                    code={authError}
                    onRequestAccess={() => setView("request")}
                  />
                )}

                {!authError && (
                  <p className="text-xs text-foreground/50 text-center font-mono uppercase tracking-wider">
                    Authorised emails only.
                  </p>
                )}

                <div className="border-t border-white/10 pt-5 text-center">
                  <p className="text-xs text-foreground/55 mb-2 font-mono uppercase tracking-wider">
                    Don&apos;t have access yet?
                  </p>
                  <button
                    onClick={() => setView("request")}
                    className="text-sm font-medium text-foreground hover:text-[var(--mbd-accent1)] transition-colors inline-flex items-center gap-1"
                    data-cursor="hover"
                  >
                    Request Account Access
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </div>

              {/* Request-access form */}
              {view === "request" && (
                <RequestAccessForm
                  onBack={() => setView("signin")}
                  onSuccess={() => setView("success")}
                />
              )}

              {/* Success state */}
              {view === "success" && (
                <div className="flex flex-col items-center gap-5 text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-[var(--mbd-accent3)]/15 border border-[var(--mbd-accent3)]/40 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-[var(--mbd-accent3)]" />
                  </div>
                  <div>
                    <span className="mbd-eyebrow">Submitted</span>
                    <h2 className="mbd-display-sm mt-2">Request received.</h2>
                    <p className="text-sm text-foreground/65 mt-2 leading-relaxed">
                      An admin will review your request shortly. You&apos;ll be able to sign in once it&apos;s approved.
                    </p>
                  </div>
                  <button
                    onClick={() => setView("signin")}
                    className="mbd-btn mbd-btn-ghost"
                    data-cursor="hover"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer tagline ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 md:px-12 py-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-2 text-foreground/45">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[var(--mbd-accent1)]" />
          Meta Build Dynamics · Employee Operating System
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em]">
          v1 · Secure · Encrypted
        </span>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Stat({ eyebrow, value }: { eyebrow: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-l border-white/10 pl-3">
      <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-foreground/55">{eyebrow}</span>
      <span
        className="text-2xl md:text-3xl font-[800] text-foreground"
        style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.03em" }}
      >
        {value}
      </span>
    </div>
  );
}

function ErrorPill({
  code,
  onRequestAccess,
}: {
  code: string;
  onRequestAccess: () => void;
}) {
  const message = (() => {
    switch (code) {
      case "EmailNotAllowed":
        return "This email isn't on the authorised list. Request access below or contact your administrator.";
      case "AccountDisabled":
        return "This account has been deactivated. Contact your administrator.";
      case "OAuthAccountNotLinked":
        return "Couldn't link this Google account. Try again or contact support.";
      case "NoEmail":
        return "Google didn't share an email address. Try again with a different account.";
      default:
        return "Sign-in failed. Try again or contact support.";
    }
  })();

  return (
    <div className="flex items-start gap-2 border border-[var(--mbd-accent1)]/30 bg-[var(--mbd-accent1)]/8 p-3 text-left"
         style={{ borderRadius: 4 }}>
      <AlertCircle className="w-4 h-4 text-[var(--mbd-accent1)] mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-foreground/85 leading-relaxed">{message}</p>
        {code === "EmailNotAllowed" && (
          <button
            onClick={onRequestAccess}
            className="mt-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--mbd-accent1)] hover:underline"
          >
            Request access →
          </button>
        )}
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
      setFieldError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-1 text-foreground/55 hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="mbd-eyebrow">Request Access</span>
          <h2 className="mbd-display-sm mt-2">Join MBD.</h2>
          <p className="text-sm text-foreground/65 mt-1.5">
            Fill in your details and an admin will review your request.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Field label="Full Name" required>
          <Input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Jane Smith"
            disabled={submitting}
            autoFocus
          />
        </Field>

        <Field label="Work Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="jane@company.com"
            disabled={submitting}
          />
        </Field>

        <Field label="Department">
          <Input
            value={form.department}
            onChange={set("department")}
            placeholder="e.g. Engineering"
            disabled={submitting}
          />
        </Field>

        <Field label="Reason / Message">
          <textarea
            value={form.reason}
            onChange={set("reason")}
            placeholder="Why do you need access?"
            disabled={submitting}
            rows={3}
            className="w-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm placeholder:text-foreground/40 focus-visible:outline-none focus-visible:border-[var(--mbd-accent1)]/50 disabled:opacity-50 resize-none"
            style={{ borderRadius: 4 }}
          />
        </Field>

        {fieldError && (
          <div className="flex items-start gap-2 border border-[var(--mbd-accent1)]/30 bg-[var(--mbd-accent1)]/8 p-3"
               style={{ borderRadius: 4 }}>
            <AlertCircle className="w-4 h-4 text-[var(--mbd-accent1)] mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/85">{fieldError}</p>
          </div>
        )}

        <button
          type="submit"
          className="mbd-btn w-full mt-1"
          disabled={submitting}
          data-cursor="hover"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
          ) : (
            "Submit Request"
          )}
        </button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-foreground/55 flex items-center gap-1.5">
        {label}
        {required && <span className="text-[var(--mbd-accent1)]">*</span>}
      </label>
      {children}
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
