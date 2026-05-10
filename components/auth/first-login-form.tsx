"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, KeyRound, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  userName: string;
}

export function FirstLoginForm({ userName }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim()) return setError("Please enter your Employee ID.");
    if (!accessCode.trim()) return setError("Please enter your Access Code.");

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verify-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ employeeId: employeeId.trim(), accessCode: accessCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed. Please check your credentials.");
        return;
      }
      setSuccess(true);
      // Reload session then redirect
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Welcome aboard!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your identity has been verified. Taking you to your dashboard…
          </p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-8 py-6 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
          <Building2 className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Hi, {userName}!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One more step before you access the portal.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-7">
        {/* Info box */}
        <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
          <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Verify your invitation</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Enter your <strong>Employee ID</strong> and <strong>Access Code</strong> from your
              invitation email to activate your account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Employee ID
            </label>
            <Input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. MBD-AA-1001"
              disabled={loading}
              autoFocus
              className="font-mono"
            />
          </div>

          {/* Access Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Access Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. X7K2M9QR"
                disabled={loading}
                maxLength={8}
                className="pl-9 font-mono tracking-widest uppercase"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying…</>
            ) : (
              "Verify & Access Portal"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-5 leading-relaxed">
          Can&apos;t find your credentials? Check your invitation email or contact your
          administrator (CEO / CMO / CTO) to reset your access code.
        </p>
      </div>
    </div>
  );
}
