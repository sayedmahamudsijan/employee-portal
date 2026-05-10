import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FirstLoginForm } from "@/components/auth/first-login-form";

export default async function FirstLoginPage() {
  const session = await getServerSession(authOptions);

  // Not signed in — go to login
  if (!session) redirect("/");

  // Already verified — go to dashboard
  if (session.user.accessCodeUsed !== false) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md px-6">
        <FirstLoginForm userName={session.user.name ?? "there"} />
      </div>
    </div>
  );
}
