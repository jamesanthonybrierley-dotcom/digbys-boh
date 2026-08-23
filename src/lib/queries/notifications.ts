import { db, newId, nowIso } from "../db";
import type { AppNotification } from "@/types";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: number;
  created_at: string;
}

function rowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

export async function findNotificationById(id: string): Promise<AppNotification | null> {
  const row = (await db.prepare("SELECT * FROM notifications WHERE id=?").get(id)) as
    | NotificationRow
    | undefined;
  return row ? rowToNotification(row) : null;
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<AppNotification> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, type, title, body, link, read, created_at)
     VALUES (@id, @userId, @type, @title, @body, @link, 0, @ts)`
    )
    .run({
      id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      ts,
    });
  return (await findNotificationById(id))!;
}

export async function listNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
  const rows = await db
    .prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit);
  return (rows as NotificationRow[]).map(rowToNotification);
}

export async function unreadCount(userId: string): Promise<number> {
  const row = (await db
    .prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND read=0")
    .get(userId)) as { c: string | number };
  return Number(row.c);
}

export async function markAllRead(userId: string): Promise<void> {
  await db.prepare("UPDATE notifications SET read=1 WHERE user_id=? AND read=0").run(userId);
}

export async function markRead(id: string, userId: string): Promise<void> {
  await db.prepare("UPDATE notifications SET read=1 WHERE id=? AND user_id=?").run(id, userId);
}

/** Notifies every active admin. Pass excludeUserId to skip the admin who triggered the event. */
export async function notifyAdmins(
  input: { type: string; title: string; body?: string | null; link?: string | null },
  excludeUserId?: string
): Promise<void> {
  const admins = (await db
    .prepare("SELECT id FROM users WHERE role='ADMIN' AND active=1")
    .all()) as { id: string }[];
  for (const a of admins) {
    if (excludeUserId && a.id === excludeUserId) continue;
    await createNotification({ ...input, userId: a.id });
  }
}

/** Notifies every active user (staff + admins). Pass excludeUserId to skip whoever triggered the event. */
export async function notifyAllActive(
  input: { type: string; title: string; body?: string | null; link?: string | null },
  excludeUserId?: string
): Promise<void> {
  const users = (await db.prepare("SELECT id FROM users WHERE active=1").all()) as { id: string }[];
  for (const u of users) {
    if (excludeUserId && u.id === excludeUserId) continue;
    await createNotification({ ...input, userId: u.id });
  }
}
