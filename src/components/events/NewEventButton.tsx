"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventFormModal } from "./EventFormModal";

export function NewEventButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New event
      </Button>
      <EventFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
