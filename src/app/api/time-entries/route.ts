import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listEntries, createManualEntry } from "@/lib/queries/timeEntries";
import { findShiftById } from "@/lib/queries/shifts";
import { manualTimeEntrySchema } from "@/lib/validation";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("from") ?? undefined;
  const dateTo = searchParams.get("to") ?? undefined;
  const requestedUserId = searchParams.get("userId") ?? undefined;

  const userId = viewer.role === "ADMIN" ? requestedUserId || undefined : viewer.id;

  const entries = await listEntries({ userId, dateFrom, dateTo });
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = manualTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const shift = await findShiftById(parsed.data.shiftId);
  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

  const entry = await createManualEntry({
    shiftId: parsed.data.shiftId,
    userId: parsed.data.userId,
    clockIn: parsed.data.clockIn,
    clockOut: parsed.data.clockOut || null,
    breakMinutes: parsed.data.breakMinutes ?? 0,
    notes: parsed.data.notes || null,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
