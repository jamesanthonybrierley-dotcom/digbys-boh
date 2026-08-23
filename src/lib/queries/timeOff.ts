import { db, newId, nowIso } from "../db";
import type { TimeOffRequest, TimeOffStatus } from "@/types";

interface RequestRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: TimeOffStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

function rowToRequest(row: RequestRow): TimeOffRequest {
  return {
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

export async function listTimeOff(
  filter: { userId?: string; status?: TimeOffStatus } = {}
): Promise<TimeOffRequest[]> {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (filter.userId) {
    clauses.push("user_id=@userId");
    params.userId = filter.userId;
  }
  if (filter.status) {
    clauses.push("status=@status");
    params.status = filter.status;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await db
    .prepare(`SELECT * FROM time_off_requests ${where} ORDER BY created_at DESC`)
    .all(params);
  return (rows as RequestRow[]).map(rowToRequest);
}

export async function findTimeOffById(id: string): Promise<TimeOffRequest | null> {
  const row = (await db.prepare("SELECT * FROM time_off_requests WHERE id=?").get(id)) as
    | RequestRow
    | undefined;
  return row ? rowToRequest(row) : null;
}

export async function createTimeOff(input: {
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}): Promise<TimeOffRequest> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO time_off_requests (id, user_id, start_date, end_date, reason, status, created_at)
     VALUES (@id, @userId, @startDate, @endDate, @reason, 'PENDING', @ts)`
    )
    .run({
      id,
      userId: input.userId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason ?? null,
      ts,
    });
  return (await findTimeOffById(id))!;
}

export async function decideTimeOff(
  id: string,
  status: "APPROVED" | "DECLINED",
  decidedBy: string
): Promise<TimeOffRequest | null> {
  const ts = nowIso();
  await db
    .prepare(
      "UPDATE time_off_requests SET status=@status, decided_by=@decidedBy, decided_at=@ts WHERE id=@id"
    )
    .run({ id, status, decidedBy, ts });
  return findTimeOffById(id);
}

export async function deleteTimeOff(id: string): Promise<void> {
  await db.prepare("DELETE FROM time_off_requests WHERE id=?").run(id);
}
