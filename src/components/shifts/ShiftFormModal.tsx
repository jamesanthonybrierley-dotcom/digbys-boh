"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
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

export function ShiftFormModal({
  open,
  onClose,
  staffOptions,
  eventOptions,
  shift,
  defaultEventId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  staffOptions: StaffOption[];
  eventOptions: EventOption[];
  shift?: Shift | null;
  defaultEventId?: string;
  defaultDate?: string;
}) {
  const router = useRouter();
  const isEdit = !!shift;
  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEventId(shift?.eventId ?? defaultEventId ?? "");
    setTitle(shift?.title ?? "");
    setLocation(shift?.location ?? "");
    setShiftDate(shift?.shiftDate ?? defaultDate ?? "");
    setStartTime(shift?.startTime ?? "");
    setEndTime(shift?.endTime ?? "");
    setNotes(shift?.notes ?? "");
    setAssignedUserId(shift?.assignedUserId ?? "");
    setError(null);
  }, [open, shift, defaultEventId, defaultDate]);

  function onEventChange(id: string) {
    setEventId(id);
    if (!isEdit) {
      const ev = eventOptions.find((e) => e.id === id);
      if (ev) {
        setLocation((current) => current || ev.location);
        setShiftDate((current) => current || ev.eventDate);
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !location || !shiftDate || !startTime || !endTime) {
      setError("Fill in title, location, date, and start/end time.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        eventId: eventId || null,
        title,
        location,
        shiftDate,
        startTime,
        endTime,
        notes,
        assignedUserId: assignedUserId || null,
      };
      const res = await fetch(isEdit ? `/api/shifts/${shift!.id}` : "/api/shifts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setLoading(false);
      onClose();
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit shift" : "New shift"}>
      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Select label="Event (optional)" value={eventId} onChange={(e) => onEventChange(e.target.value)}>
          <option value="">Standalone shift</option>
          {eventOptions.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} · {ev.eventDate}
            </option>
          ))}
        </Select>
        <Input
          label="Title"
          required
          placeholder="e.g. Bar staff"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Location"
          required
          placeholder="e.g. The Barn, Henley"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            required
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
          />
          <Input
            label="Start"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <Select
          label="Assign to"
          value={assignedUserId}
          onChange={(e) => setAssignedUserId(e.target.value)}
          hint="Leave as Open to put it up for grabs"
        >
          <option value="">Open (up for grabs)</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Textarea
          label="Notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? "Save changes" : "Create shift"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
