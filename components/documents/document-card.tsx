import { FileText, FolderOpen, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string | null;
  createdAt: Date;
  uploader: { name: string; image: string | null };
}

interface Props {
  document: Document;
}

const categoryIcons: Record<string, typeof FileText> = {
  POLICIES: FolderOpen,
  SOPS: FileText,
  ONBOARDING: FolderOpen,
  TEMPLATES: FileText,
  OTHER: FileText,
};

export function DocumentCard({ document }: Props) {
  const Icon = categoryIcons[document.category.toUpperCase()] ?? FileText;

  return (
    <a
      href={document.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="space-y-1 flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {document.title}
        </p>
        {document.fileType && (
          <span className="inline-block text-xs text-muted-foreground uppercase font-medium">
            {document.fileType}
          </span>
        )}
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">
          {document.uploader.name}
        </span>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDate(document.createdAt)}
        </span>
      </div>
    </a>
  );
}
