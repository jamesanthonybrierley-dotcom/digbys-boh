import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { listUsers, createUser, emailExists } from "@/lib/queries/users";
import { createStaffSchema } from "@/lib/validation";
import { serializeUserForViewer } from "@/lib/permissions";
import { poundsToPence, randomPassword } from "@/lib/utils";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const users = await listUsers({ includeInactive: viewer.role === "ADMIN" });
  const serialized = users.map((u) => serializeUserForViewer(u, viewer));
  return NextResponse.json({ users: serialized });
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, role, position, phone, hourlyRate } = parsed.data;

  if (await emailExists(email)) {
    return NextResponse.json(
      { error: "A staff member with that email already exists" },
      { status: 409 }
    );
  }

  const tempPassword = randomPassword();
  const passwordHash = await hashPassword(tempPassword);
  const user = await createUser({
    name,
    email,
    passwordHash,
    role,
    position: position || null,
    phone: phone || null,
    hourlyRatePence: hourlyRate != null ? poundsToPence(hourlyRate) : null,
    mustChangePassword: true,
  });

  return NextResponse.json({ user, tempPassword }, { status: 201 });
}
