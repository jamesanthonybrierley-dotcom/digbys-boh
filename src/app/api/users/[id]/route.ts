import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findUserById, updateUser, emailExists } from "@/lib/queries/users";
import { updateStaffSchema } from "@/lib/validation";
import { serializeUserForViewer } from "@/lib/permissions";
import { poundsToPence } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (viewer.role !== "ADMIN" && viewer.id !== params.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const user = await findUserById(params.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: serializeUserForViewer(user, viewer) });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await findUserById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.email && (await emailExists(parsed.data.email, params.id))) {
    return NextResponse.json(
      { error: "Another staff member already uses that email" },
      { status: 409 }
    );
  }

  if (existing.id === viewer.id && parsed.data.role === "STAFF") {
    return NextResponse.json({ error: "You can't remove your own admin access" }, { status: 400 });
  }
  if (existing.id === viewer.id && parsed.data.active === false) {
    return NextResponse.json({ error: "You can't deactivate your own account" }, { status: 400 });
  }

  const patch: Parameters<typeof updateUser>[1] = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.email !== undefined) patch.email = parsed.data.email;
  if (parsed.data.role !== undefined) patch.role = parsed.data.role;
  if (parsed.data.position !== undefined) patch.position = parsed.data.position || null;
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone || null;
  if (parsed.data.hourlyRate !== undefined) {
    patch.hourlyRatePence =
      parsed.data.hourlyRate != null ? poundsToPence(parsed.data.hourlyRate) : null;
  }
  if (parsed.data.active !== undefined) patch.active = parsed.data.active;

  const user = await updateUser(params.id, patch);
  return NextResponse.json({ user });
}
