import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listEvents, createEvent } from "@/lib/queries/events";
import { eventSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const upcomingOnly = searchParams.get("upcoming") === "1";
  const events = await listEvents({ upcomingOnly });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const event = await createEvent({
    name: d.name,
    clientName: d.clientName || null,
    location: d.location,
    address: d.address || null,
    eventDate: d.eventDate,
    startTime: d.startTime || null,
    endTime: d.endTime || null,
    guestCount: d.guestCount ?? null,
    notes: d.notes || null,
    status: d.status,
    createdBy: viewer.id,
  });

  return NextResponse.json({ event }, { status: 201 });
}
