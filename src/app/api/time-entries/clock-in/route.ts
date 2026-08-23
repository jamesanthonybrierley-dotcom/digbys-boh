import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { findShiftById } from "@/lib/queries/shifts";
import { clockIn, findOpenEntryForUser } from "@/lib/queries/timeEntries";

const bodySchema = z.object({ shiftId: z.string().uuid() });

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a shift to clock in to" }, { status: 400 });
  }

  const shift = await findShiftById(parsed.data.shiftId);
  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  if (shift.assignedUserId !== viewer.id) {
    return NextResponse.json({ error: "This shift isn't assigned to you" }, { status: 403 });
  }

  const alreadyOpen = await findOpenEntryForUser(viewer.id);
  if (alreadyOpen) {
    return NextResponse.json(
      { error: "You're already clocked in. Clock out first." },
      { status: 409 }
    );
  }

  const entry = await clockIn(shift.id, viewer.id);
  return NextResponse.json({ entry }, { status: 201 });
}
