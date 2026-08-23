import { db, newId, nowIso } from "../db";
import { todayIsoDate } from "../utils";
import type { EventRecord, EventStatus } from "@/types";

interface EventRow {
  id: string;
  name: string;
  client_name: string | null;
  location: string;
  address: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  guest_count: number | null;
  notes: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function rowToEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    location: row.location,
    address: row.address,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    guestCount: row.guest_count,
    notes: row.notes,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEvents(opts: { upcomingOnly?: boolean } = {}): Promise<EventRecord[]> {
  const rows = opts.upcomingOnly
    ? await db
        .prepare(
          "SELECT * FROM events WHERE event_date >= @today AND status != 'CANCELLED' ORDER BY event_date ASC"
        )
        .all({ today: todayIsoDate() })
    : await db.prepare("SELECT * FROM events ORDER BY event_date DESC").all();
  return (rows as EventRow[]).map(rowToEvent);
}

export async function findEventById(id: string): Promise<EventRecord | null> {
  const row = (await db.prepare("SELECT * FROM events WHERE id=?").get(id)) as EventRow | undefined;
  return row ? rowToEvent(row) : null;
}

export async function createEvent(input: {
  name: string;
  clientName?: string | null;
  location: string;
  address?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  guestCount?: number | null;
  notes?: string | null;
  status?: EventStatus;
  createdBy: string;
}): Promise<EventRecord> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO events (id, name, client_name, location, address, event_date, start_time, end_time, guest_count, notes, status, created_by, created_at, updated_at)
     VALUES (@id, @name, @clientName, @location, @address, @eventDate, @startTime, @endTime, @guestCount, @notes, @status, @createdBy, @ts, @ts)`
    )
    .run({
      id,
      name: input.name,
      clientName: input.clientName ?? null,
      location: input.location,
      address: input.address ?? null,
      eventDate: input.eventDate,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      guestCount: input.guestCount ?? null,
      notes: input.notes ?? null,
      status: input.status ?? "CONFIRMED",
      createdBy: input.createdBy,
      ts,
    });
  return (await findEventById(id))!;
}

export async function updateEvent(
  id: string,
  patch: Partial<{
    name: string;
    clientName: string | null;
    location: string;
    address: string | null;
    eventDate: string;
    startTime: string | null;
    endTime: string | null;
    guestCount: number | null;
    notes: string | null;
    status: EventStatus;
  }>
): Promise<EventRecord | null> {
  const existing = await findEventById(id);
  if (!existing) return null;
  const m = { ...existing, ...patch };
  await db
    .prepare(
      `UPDATE events SET name=@name, client_name=@clientName, location=@location, address=@address,
     event_date=@eventDate, start_time=@startTime, end_time=@endTime, guest_count=@guestCount,
     notes=@notes, status=@status, updated_at=@ts WHERE id=@id`
    )
    .run({
      id,
      name: m.name,
      clientName: m.clientName,
      location: m.location,
      address: m.address,
      eventDate: m.eventDate,
      startTime: m.startTime,
      endTime: m.endTime,
      guestCount: m.guestCount,
      notes: m.notes,
      status: m.status,
      ts: nowIso(),
    });
  return findEventById(id);
}

export async function deleteEvent(id: string): Promise<void> {
  await db.prepare("DELETE FROM events WHERE id=?").run(id);
}
