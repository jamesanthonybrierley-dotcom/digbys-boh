"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import type { EventRecord, EventStatus } from "@/types";

export function EventFormModal({
  open,
  onClose,
  event,
}: {
  open: boolean;
  onClose: () => void;
  event?: EventRecord | null;
}) {
  const router = useRouter();
  const isEdit = !!event;
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EventStatus>("CONFIRMED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(event?.name ?? "");
    setClientName(event?.clientName ?? "");
    setLocation(event?.location ?? "");
    setAddress(event?.address ?? "");
    setEventDate(event?.eventDate ?? "");
    setStartTime(event?.startTime ?? "");
    setEndTime(event?.endTime ?? "");
    setGuestCount(event?.guestCount != null ? String(event.guestCount) : "");
    setNotes(event?.notes ?? "");
    setStatus(event?.status ?? "CONFIRMED");
    setError(null);
  }, [open, event]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !location || !eventDate) {
      setError("Fill in the event name, location, and date.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name,
        clientName,
        location,
        address,
        eventDate,
        startTime,
        endTime,
        guestCount: guestCount ? Number(guestCount) : null,
        notes,
        status,
      };
      const res = await fetch(isEdit ? `/api/events/${event!.id}` : "/api/events", {
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit event" : "New event"} className="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Input
          label="Event name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hartley Wedding"
        />
        <Input label="Client (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Location"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. The Barn, Henley"
          />
          <Input
            label="Date"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Start (optional)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End (optional)" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <Input
            label="Guests"
            type="number"
            min="0"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
          />
        </div>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as EventStatus)}>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Textarea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? "Save changes" : "Create event"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
