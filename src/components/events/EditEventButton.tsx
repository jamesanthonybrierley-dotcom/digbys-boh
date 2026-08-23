"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventFormModal } from "./EventFormModal";
import type { EventRecord } from "@/types";

export function EditEventButton({ event }: { event: EventRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit event
      </Button>
      <EventFormModal open={open} onClose={() => setOpen(false)} event={event} />
    </>
  );
}
