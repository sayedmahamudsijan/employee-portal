import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PendingApprovalPage } from "@/components/auth/pending-page";

export default async function PendingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  if (session.user.status === "ACTIVE") redirect("/dashboard");
  return <PendingApprovalPage user={session.user} />;
}
