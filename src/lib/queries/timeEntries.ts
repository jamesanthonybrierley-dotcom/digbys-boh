import { db, newId, nowIso } from "../db";
import { addDaysToIsoDate, londonDateOf } from "../utils";
import type { TimeEntry } from "@/types";

interface EntryRow {
  id: string;
  shift_id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  edited_by_admin: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: EntryRow): TimeEntry {
  return {
    id: row.id,
    shiftId: row.shift_id,
    userId: row.user_id,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    breakMinutes: row.break_minutes,
    editedByAdmin: !!row.edited_by_admin,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findOpenEntryForUser(userId: string): Promise<TimeEntry | null> {
  const row = (await db
    .prepare(
      "SELECT * FROM time_entries WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1"
    )
    .get(userId)) as EntryRow | undefined;
  return row ? rowToEntry(row) : null;
}

export async function countOpenEntries(): Promise<number> {
  const row = (await db
    .prepare("SELECT COUNT(*) as c FROM time_entries WHERE clock_out IS NULL")
    .get()) as { c: string | number };
  return Number(row.c);
}

export async function findEntryById(id: string): Promise<TimeEntry | null> {
  const row = (await db.prepare("SELECT * FROM time_entries WHERE id=?").get(id)) as
    | EntryRow
    | undefined;
  return row ? rowToEntry(row) : null;
}

export async function clockIn(shiftId: string, userId: string): Promise<TimeEntry> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO time_entries (id, shift_id, user_id, clock_in, break_minutes, edited_by_admin, created_at, updated_at)
     VALUES (@id, @shiftId, @userId, @ts, 0, 0, @ts, @ts)`
    )
    .run({ id, shiftId, userId, ts });
  return (await findEntryById(id))!;
}

export async function clockOut(entryId: string): Promise<TimeEntry | null> {
  const ts = nowIso();
  const result = await db
    .prepare("UPDATE time_entries SET clock_out=@ts, updated_at=@ts WHERE id=@id AND clock_out IS NULL")
    .run({ id: entryId, ts });
  if (result.changes === 0) return null;
  return findEntryById(entryId);
}

export async function listEntries(
  filter: { userId?: string; dateFrom?: string; dateTo?: string; shiftId?: string } = {}
): Promise<TimeEntry[]> {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.userId) {
    clauses.push("user_id=@userId");
    params.userId = filter.userId;
  }
  if (filter.shiftId) {
    clauses.push("shift_id=@shiftId");
    params.shiftId = filter.shiftId;
  }
  if (filter.dateFrom) {
    clauses.push("clock_in >= @dateFrom");
    params.dateFrom = filter.dateFrom;
  }
  if (filter.dateTo) {
    clauses.push("clock_in <= @dateTo");
    params.dateTo = filter.dateTo;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await db.prepare(`SELECT * FROM time_entries ${where} ORDER BY clock_in DESC`).all(params);
  return (rows as EntryRow[]).map(rowToEntry);
}

/**
 * Like listEntries, but startDate/endDate are Europe/London calendar dates
 * (inclusive) rather than raw string bounds on the stored UTC clock_in.
 * Widens the underlying query by a day on each side to safely cover
 * BST/GMT boundary entries, then filters precisely by London-local date.
 */
export async function listEntriesForLondonRange(opts: {
  userId?: string;
  startDate: string;
  endDate: string;
}): Promise<TimeEntry[]> {
  const wideFrom = addDaysToIsoDate(opts.startDate, -1);
  const wideTo = addDaysToIsoDate(opts.endDate, 1);
  const raw = await listEntries({
    userId: opts.userId,
    dateFrom: wideFrom,
    dateTo: `${wideTo}T23:59:59.999`,
  });
  return raw.filter((e) => {
    const day = londonDateOf(e.clockIn);
    return day >= opts.startDate && day <= opts.endDate;
  });
}

export async function createManualEntry(input: {
  shiftId: string;
  userId: string;
  clockIn: string;
  clockOut?: string | null;
  breakMinutes?: number;
  notes?: string | null;
}): Promise<TimeEntry> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO time_entries (id, shift_id, user_id, clock_in, clock_out, break_minutes, edited_by_admin, notes, created_at, updated_at)
     VALUES (@id, @shiftId, @userId, @clockIn, @clockOut, @breakMinutes, 1, @notes, @ts, @ts)`
    )
    .run({
      id,
      shiftId: input.shiftId,
      userId: input.userId,
      clockIn: input.clockIn,
      clockOut: input.clockOut ?? null,
      breakMinutes: input.breakMinutes ?? 0,
      notes: input.notes ?? null,
      ts,
    });
  return (await findEntryById(id))!;
}

export async function updateEntry(
  id: string,
  patch: Partial<{
    clockIn: string;
    clockOut: string | null;
    breakMinutes: number;
    notes: string | null;
  }>
): Promise<TimeEntry | null> {
  const existing = await findEntryById(id);
  if (!existing) return null;
  const m = { ...existing, ...patch };
  await db
    .prepare(
      `UPDATE time_entries SET clock_in=@clockIn, clock_out=@clockOut, break_minutes=@breakMinutes,
     notes=@notes, edited_by_admin=1, updated_at=@ts WHERE id=@id`
    )
    .run({
      id,
      clockIn: m.clockIn,
      clockOut: m.clockOut,
      breakMinutes: m.breakMinutes,
      notes: m.notes,
      ts: nowIso(),
    });
  return findEntryById(id);
}

export async function deleteEntry(id: string): Promise<void> {
  await db.prepare("DELETE FROM time_entries WHERE id=?").run(id);
}
