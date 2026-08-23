"use client";

import { useState } from "react";
import { Plus, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShiftCard } from "./ShiftCard";
import { ShiftFormModal } from "./ShiftFormModal";
import type { Shift } from "@/types";

interface StaffOption {
  id: string;
  name: string;
}
interface EventOption {
  id: string;
  name: string;
  location: string;
  eventDate: string;
}
interface ShiftWithNames extends Shift {
  assignedUserName?: string | null;
  eventName?: string | null;
}

export function AdminShiftList({
  shifts,
  staffOptions,
  eventOptions,
  defaultEventId,
  defaultDate,
  emptyLabel = "No shifts here yet",
}: {
  shifts: ShiftWithNames[];
  staffOptions: StaffOption[];
  eventOptions: EventOption[];
  defaultEventId?: string;
  defaultDate?: string;
  emptyLabel?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(shift: Shift) {
    setEditing(shift);
    setModalOpen(true);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add shift
        </Button>
      </div>
      {shifts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={emptyLabel}
          action={
            <Button size="sm" onClick={openCreate}>
              Add a shift
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => (
            <ShiftCard
              key={s.id}
              shift={s}
              assignedUserName={s.assignedUserName}
              eventName={s.eventName}
              actions={
                <button
                  onClick={() => openEdit(s)}
                  className="focus-ring flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              }
            />
          ))}
        </div>
      )}
      <ShiftFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staffOptions={staffOptions}
        eventOptions={eventOptions}
        shift={editing}
        defaultEventId={defaultEventId}
        defaultDate={defaultDate}
      />
    </div>
  );
}
