import { db, newId, nowIso } from "../db";
import type { Shift, ShiftStatus } from "@/types";

interface ShiftRow {
  id: string;
  event_id: string | null;
  title: string;
  location: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: ShiftStatus;
  assigned_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function rowToShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    location: row.location,
    shiftDate: row.shift_date,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    status: row.status,
    assignedUserId: row.assigned_user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ShiftFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: ShiftStatus;
  /** Pass null to find shifts with no one assigned. */
  assignedUserId?: string | null;
  eventId?: string;
}

export async function listShifts(filter: ShiftFilter = {}): Promise<Shift[]> {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.dateFrom) {
    clauses.push("shift_date >= @dateFrom");
    params.dateFrom = filter.dateFrom;
  }
  if (filter.dateTo) {
    clauses.push("shift_date <= @dateTo");
    params.dateTo = filter.dateTo;
  }
  if (filter.status) {
    clauses.push("status = @status");
    params.status = filter.status;
  }
  if (filter.eventId) {
    clauses.push("event_id = @eventId");
    params.eventId = filter.eventId;
  }
  if (filter.assignedUserId !== undefined) {
    if (filter.assignedUserId === null) {
      clauses.push("assigned_user_id IS NULL");
    } else {
      clauses.push("assigned_user_id = @assignedUserId");
      params.assignedUserId = filter.assignedUserId;
    }
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await db
    .prepare(`SELECT * FROM shifts ${where} ORDER BY shift_date ASC, start_time ASC`)
    .all(params);
  return (rows as ShiftRow[]).map(rowToShift);
}

export async function findShiftById(id: string): Promise<Shift | null> {
  const row = (await db.prepare("SELECT * FROM shifts WHERE id=?").get(id)) as ShiftRow | undefined;
  return row ? rowToShift(row) : null;
}

export async function createShift(input: {
  eventId?: string | null;
  title: string;
  location: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  assignedUserId?: string | null;
  createdBy: string;
}): Promise<Shift> {
  const id = newId();
  const ts = nowIso();
  const status: ShiftStatus = input.assignedUserId ? "ASSIGNED" : "OPEN";
  await db
    .prepare(
      `INSERT INTO shifts (id, event_id, title, location, shift_date, start_time, end_time, notes, status, assigned_user_id, created_by, created_at, updated_at)
     VALUES (@id, @eventId, @title, @location, @shiftDate, @startTime, @endTime, @notes, @status, @assignedUserId, @createdBy, @ts, @ts)`
    )
    .run({
      id,
      eventId: input.eventId ?? null,
      title: input.title,
      location: input.location,
      shiftDate: input.shiftDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes ?? null,
      status,
      assignedUserId: input.assignedUserId ?? null,
      createdBy: input.createdBy,
      ts,
    });
  return (await findShiftById(id))!;
}

export async function updateShift(
  id: string,
  patch: Partial<{
    eventId: string | null;
    title: string;
    location: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    notes: string | null;
    assignedUserId: string | null;
    status: ShiftStatus;
  }>
): Promise<Shift | null> {
  const existing = await findShiftById(id);
  if (!existing) return null;
  const m = { ...existing, ...patch };
  if (patch.assignedUserId !== undefined && patch.status === undefined) {
    m.status = m.assignedUserId ? "ASSIGNED" : "OPEN";
  }
  await db
    .prepare(
      `UPDATE shifts SET event_id=@eventId, title=@title, location=@location, shift_date=@shiftDate,
     start_time=@startTime, end_time=@endTime, notes=@notes, status=@status,
     assigned_user_id=@assignedUserId, updated_at=@ts WHERE id=@id`
    )
    .run({
      id,
      eventId: m.eventId,
      title: m.title,
      location: m.location,
      shiftDate: m.shiftDate,
      startTime: m.startTime,
      endTime: m.endTime,
      notes: m.notes,
      status: m.status,
      assignedUserId: m.assignedUserId,
      ts: nowIso(),
    });
  return findShiftById(id);
}

export async function deleteShift(id: string): Promise<void> {
  await db.prepare("DELETE FROM shifts WHERE id=?").run(id);
}

/** Atomically claims an open shift. Returns null if it was no longer open (already taken). */
export async function claimShift(id: string, userId: string): Promise<Shift | null> {
  const ts = nowIso();
  const result = await db
    .prepare(
      "UPDATE shifts SET status='ASSIGNED', assigned_user_id=@userId, updated_at=@ts WHERE id=@id AND status='OPEN'"
    )
    .run({ id, userId, ts });
  if (result.changes === 0) return null;
  return findShiftById(id);
}

/** Releases a shift back to the open pool. Only succeeds if assigned to userId, unless force is set. */
export async function releaseShift(id: string, userId: string, force = false): Promise<Shift | null> {
  const ts = nowIso();
  const result = force
    ? await db
        .prepare("UPDATE shifts SET status='OPEN', assigned_user_id=NULL, updated_at=@ts WHERE id=@id")
        .run({ id, ts })
    : await db
        .prepare(
          "UPDATE shifts SET status='OPEN', assigned_user_id=NULL, updated_at=@ts WHERE id=@id AND assigned_user_id=@userId"
        )
        .run({ id, userId, ts });
  if (result.changes === 0) return null;
  return findShiftById(id);
}
