import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/roles";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsClient } from "@/components/documents/documents-client";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = canAccess(session.user.role, "ADMIN");

  const documents = await prisma.document.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      fileUrl: true,
      fileType: true,
      createdAt: true,
      uploader: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Company policies, SOPs, and reference materials"
      />
      <DocumentsClient documents={documents} isAdmin={isAdmin} />
    </div>
  );
}
