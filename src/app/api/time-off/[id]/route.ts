import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findTimeOffById, decideTimeOff, deleteTimeOff } from "@/lib/queries/timeOff";
import { decideTimeOffSchema } from "@/lib/validation";
import { createNotification } from "@/lib/queries/notifications";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findTimeOffById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = decideTimeOffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await decideTimeOff(params.id, parsed.data.status, viewer.id);
  if (updated) {
    await createNotification({
      userId: updated.userId,
      type: "TIME_OFF_DECIDED",
      title: `Your time off request was ${parsed.data.status.toLowerCase()}`,
      body: `${updated.startDate} to ${updated.endDate}`,
      link: "/time-off",
    });
  }

  return NextResponse.json({ request: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existing = await findTimeOffById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwn = existing.userId === viewer.id;
  if (!isOwn && viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (isOwn && existing.status !== "PENDING" && viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "This request has already been decided" }, { status: 409 });
  }

  await deleteTimeOff(params.id);
  return NextResponse.json({ ok: true });
}
