"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Tabs } from "@base-ui/react/tabs";
import { DocumentCard } from "./document-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus, X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "Policies", label: "Policies" },
  { value: "SOPs", label: "SOPs" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "Templates", label: "Templates" },
  { value: "Other", label: "Other" },
] as const;

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  fileUrl: z.string().url("Must be a valid URL"),
  fileType: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

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
  documents: Document[];
  isAdmin: boolean;
}

export function DocumentsClient({ documents, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<string>("Policies");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [allDocs, setAllDocs] = useState<Document[]>(documents);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({ resolver: zodResolver(uploadSchema) });

  const filtered = allDocs.filter(
    (d) => d.category.toLowerCase() === activeTab.toLowerCase()
  );

  const onSubmit = async (data: UploadForm) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setAllDocs((prev) => [json.data, ...prev]);
      toast.success("Document uploaded successfully");
      reset();
      setUploadOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        {isAdmin && (
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            Upload Document
          </Button>
        )}
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border mb-5">
          {TABS.map((tab) => {
            const count = allDocs.filter(
              (d) => d.category.toLowerCase() === tab.value.toLowerCase()
            ).length;
            return (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  "data-[selected]:border-primary data-[selected]:text-foreground",
                  "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                )}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {TABS.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title={`No ${tab.label} documents yet`}
                description="Documents uploaded to this category will appear here."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      {/* Upload Dialog */}
      <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Popup
            className={cn(
              "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
              "rounded-xl bg-popover p-6 shadow-xl ring-1 ring-foreground/10",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Upload Document
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                  Add a new document to the library
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="rounded-md p-1 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  {...register("title")}
                  placeholder="Document title"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select
                  {...register("category")}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="">Select category</option>
                  {TABS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">File URL</label>
                <input
                  {...register("fileUrl")}
                  placeholder="https://..."
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                {errors.fileUrl && (
                  <p className="text-xs text-destructive">{errors.fileUrl.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  File Type <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  {...register("fileType")}
                  placeholder="PDF, DOCX, XLSX…"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Dialog.Close render={<Button variant="outline" size="sm" type="button" />}>
                  Cancel
                </Dialog.Close>
                <Button size="sm" type="submit" disabled={isSubmitting}>
                  <Upload className="w-4 h-4" />
                  {isSubmitting ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
