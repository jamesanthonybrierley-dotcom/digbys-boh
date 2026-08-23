import { db, newId, nowIso } from "../db";
import type { Role, User, UserWithSecret } from "@/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  position: string | null;
  hourly_rate_pence: number | null;
  phone: string | null;
  active: number;
  must_change_password: number;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    position: row.position,
    hourlyRatePence: row.hourly_rate_pence,
    phone: row.phone,
    active: !!row.active,
    mustChangePassword: !!row.must_change_password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToUserWithSecret(row: UserRow): UserWithSecret {
  return { ...rowToUser(row), passwordHash: row.password_hash };
}

export async function findUserByEmail(email: string): Promise<UserWithSecret | null> {
  const row = (await db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email)) as
    | UserRow
    | undefined;
  return row ? rowToUserWithSecret(row) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = (await db.prepare("SELECT * FROM users WHERE id = ?").get(id)) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export async function listUsers(opts: { includeInactive?: boolean } = {}): Promise<User[]> {
  const rows = opts.includeInactive
    ? await db.prepare("SELECT * FROM users ORDER BY lower(name)").all()
    : await db.prepare("SELECT * FROM users WHERE active = 1 ORDER BY lower(name)").all();
  return (rows as UserRow[]).map(rowToUser);
}

export async function emailExists(email: string, excludeId?: string): Promise<boolean> {
  const row = excludeId
    ? await db
        .prepare("SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?")
        .get(email, excludeId)
    : await db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(email);
  return !!row;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  position?: string | null;
  hourlyRatePence?: number | null;
  phone?: string | null;
  mustChangePassword?: boolean;
}): Promise<User> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO users (id, name, email, password_hash, role, position, hourly_rate_pence, phone, active, must_change_password, created_at, updated_at)
     VALUES (@id, @name, @email, @passwordHash, @role, @position, @hourlyRatePence, @phone, 1, @mustChangePassword, @ts, @ts)`
    )
    .run({
      id,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      position: input.position ?? null,
      hourlyRatePence: input.hourlyRatePence ?? null,
      phone: input.phone ?? null,
      mustChangePassword: input.mustChangePassword ? 1 : 0,
      ts,
    });
  return (await findUserById(id))!;
}

export async function updateUser(
  id: string,
  patch: Partial<{
    name: string;
    email: string;
    role: Role;
    position: string | null;
    hourlyRatePence: number | null;
    phone: string | null;
    active: boolean;
  }>
): Promise<User | null> {
  const existing = await findUserById(id);
  if (!existing) return null;
  const m = { ...existing, ...patch };
  await db
    .prepare(
      `UPDATE users SET name=@name, email=@email, role=@role, position=@position,
     hourly_rate_pence=@hourlyRatePence, phone=@phone, active=@active, updated_at=@ts WHERE id=@id`
    )
    .run({
      id,
      name: m.name,
      email: m.email,
      role: m.role,
      position: m.position,
      hourlyRatePence: m.hourlyRatePence,
      phone: m.phone,
      active: m.active ? 1 : 0,
      ts: nowIso(),
    });
  return findUserById(id);
}

export async function setPasswordHash(
  id: string,
  passwordHash: string,
  mustChangePassword = false
): Promise<void> {
  await db
    .prepare("UPDATE users SET password_hash=?, must_change_password=?, updated_at=? WHERE id=?")
    .run(passwordHash, mustChangePassword ? 1 : 0, nowIso(), id);
}

export async function clearMustChangePassword(id: string): Promise<void> {
  await db
    .prepare("UPDATE users SET must_change_password=0, updated_at=? WHERE id=?")
    .run(nowIso(), id);
}

export async function deleteUser(id: string): Promise<void> {
  await db.prepare("DELETE FROM users WHERE id=?").run(id);
}
