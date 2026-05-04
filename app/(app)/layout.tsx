import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/");
  if (session.user.status === "PENDING") redirect("/pending");
  if (session.user.status === "INACTIVE") redirect("/");

  return <AppShell session={session}>{children}</AppShell>;
}
