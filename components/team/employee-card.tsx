"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Briefcase, Building2, User, X, CheckSquare } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  status: string;
  createdAt: Date;
  manager: { id: string; name: string; image: string | null } | null;
  _count: { tasks: number };
}

interface Props {
  employee: Employee;
}

export function EmployeeCard({ employee }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-3 text-center hover:shadow-md hover:border-primary/30 transition-all cursor-pointer w-full"
      >
        <Avatar name={employee.name} src={employee.image} size="lg" />
        <div className="space-y-1 w-full">
          <p className="text-sm font-semibold text-foreground truncate">{employee.name}</p>
          {employee.jobTitle && (
            <p className="text-xs text-muted-foreground truncate">{employee.jobTitle}</p>
          )}
          {employee.department && (
            <p className="text-xs text-primary/80 font-medium truncate">{employee.department}</p>
          )}
          {employee.manager && (
            <p className="text-xs text-muted-foreground truncate">
              Reports to {employee.manager.name}
            </p>
          )}
        </div>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
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
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <Avatar name={employee.name} src={employee.image} size="lg" />
                <div>
                  <Dialog.Title className="text-base font-semibold text-foreground">
                    {employee.name}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                    {employee.email}
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close
                className="rounded-md p-1 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Dialog.Close>
            </div>

            <div className="space-y-3">
              {employee.jobTitle && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{employee.jobTitle}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{employee.department}</span>
                </div>
              )}
              {employee.manager && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <Avatar name={employee.manager.name} src={employee.manager.image} size="xs" />
                    <span className="text-foreground">{employee.manager.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <CheckSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{employee._count.tasks} tasks assigned</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={employee.status} />
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(employee.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Dialog.Close render={<Button variant="outline" size="sm" />}>
                Close
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
