import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listShifts, createShift } from "@/lib/queries/shifts";
import { findEventById } from "@/lib/queries/events";
import { shiftSchema } from "@/lib/validation";
import { createNotification, notifyAllActive } from "@/lib/queries/notifications";
import type { ShiftStatus } from "@/types";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("from") ?? undefined;
  const dateTo = searchParams.get("to") ?? undefined;
  const status = (searchParams.get("status") as ShiftStatus | null) ?? undefined;
  const eventId = searchParams.get("eventId") ?? undefined;
  const mine = searchParams.get("mine") === "1";
  const openOnly = searchParams.get("open") === "1";

  const shifts = await listShifts({
    dateFrom,
    dateTo,
    status: openOnly ? "OPEN" : status ?? undefined,
    eventId,
    assignedUserId: mine ? viewer.id : undefined,
  });
  return NextResponse.json({ shifts });
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = shiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (d.eventId) {
    const event = await findEventById(d.eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const shift = await createShift({
    eventId: d.eventId || null,
    title: d.title,
    location: d.location,
    shiftDate: d.shiftDate,
    startTime: d.startTime,
    endTime: d.endTime,
    notes: d.notes || null,
    assignedUserId: d.assignedUserId || null,
    createdBy: viewer.id,
  });

  if (shift.assignedUserId) {
    await createNotification({
      userId: shift.assignedUserId,
      type: "SHIFT_ASSIGNED",
      title: "You've been added to a shift",
      body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime}`,
      link: "/schedule",
    });
  } else {
    await notifyAllActive(
      {
        type: "SHIFT_OPEN",
        title: "A shift is up for grabs",
        body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime} at ${shift.location}`,
        link: "/shifts/open",
      },
      viewer.id
    );
  }

  return NextResponse.json({ shift }, { status: 201 });
}
