"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NewStaffModal } from "./NewStaffModal";

export function NewStaffButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add staff
      </Button>
      <NewStaffModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
