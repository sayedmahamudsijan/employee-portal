"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeaveRequestModal } from "@/components/leave/leave-request-modal";

export function LeaveRequestButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Request Leave
      </Button>
      <LeaveRequestModal open={open} onOpenChange={setOpen} />
    </>
  );
}
