import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findEventById, updateEvent, deleteEvent } from "@/lib/queries/events";
import { listShifts } from "@/lib/queries/shifts";
import { listEntries } from "@/lib/queries/timeEntries";
import { eventSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const event = await findEventById(params.id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const shifts = await listShifts({ eventId: params.id });
  return NextResponse.json({ event, shifts });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findEventById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const event = await updateEvent(params.id, {
    ...(d.name !== undefined && { name: d.name }),
    ...(d.clientName !== undefined && { clientName: d.clientName || null }),
    ...(d.location !== undefined && { location: d.location }),
    ...(d.address !== undefined && { address: d.address || null }),
    ...(d.eventDate !== undefined && { eventDate: d.eventDate }),
    ...(d.startTime !== undefined && { startTime: d.startTime || null }),
    ...(d.endTime !== undefined && { endTime: d.endTime || null }),
    ...(d.guestCount !== undefined && { guestCount: d.guestCount ?? null }),
    ...(d.notes !== undefined && { notes: d.notes || null }),
    ...(d.status !== undefined && { status: d.status }),
  });

  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findEventById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shifts = await listShifts({ eventId: params.id });
  const entryCounts = await Promise.all(shifts.map((s) => listEntries({ shiftId: s.id })));
  const hasHistory = entryCounts.some((entries) => entries.length > 0);
  if (hasHistory) {
    return NextResponse.json(
      { error: "This event has recorded time entries. Cancel it instead of deleting." },
      { status: 409 }
    );
  }

  await deleteEvent(params.id);
  return NextResponse.json({ ok: true });
}
