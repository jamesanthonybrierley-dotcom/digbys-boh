import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { findShiftById, updateShift, deleteShift } from "@/lib/queries/shifts";
import { listEntries } from "@/lib/queries/timeEntries";
import { createNotification } from "@/lib/queries/notifications";

const patchSchema = z.object({
  eventId: z.string().uuid().optional().nullable().or(z.literal("")),
  title: z.string().min(1).max(120).optional(),
  location: z.string().min(1).max(200).optional(),
  shiftDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  assignedUserId: z.string().uuid().optional().nullable().or(z.literal("")),
  status: z.enum(["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const shift = await findShiftById(params.id);
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ shift });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findShiftById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const previousAssignee = existing.assignedUserId;

  const shift = await updateShift(params.id, {
    ...(d.eventId !== undefined && { eventId: d.eventId || null }),
    ...(d.title !== undefined && { title: d.title }),
    ...(d.location !== undefined && { location: d.location }),
    ...(d.shiftDate !== undefined && { shiftDate: d.shiftDate }),
    ...(d.startTime !== undefined && { startTime: d.startTime }),
    ...(d.endTime !== undefined && { endTime: d.endTime }),
    ...(d.notes !== undefined && { notes: d.notes || null }),
    ...(d.assignedUserId !== undefined && { assignedUserId: d.assignedUserId || null }),
    ...(d.status !== undefined && { status: d.status }),
  });

  if (
    shift &&
    d.assignedUserId !== undefined &&
    d.assignedUserId &&
    d.assignedUserId !== previousAssignee
  ) {
    await createNotification({
      userId: d.assignedUserId,
      type: "SHIFT_ASSIGNED",
      title: "You've been added to a shift",
      body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime}`,
      link: "/schedule",
    });
  }

  return NextResponse.json({ shift });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findShiftById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await listEntries({ shiftId: params.id });
  if (entries.length > 0) {
    return NextResponse.json(
      { error: "This shift has recorded time entries. Cancel it instead of deleting." },
      { status: 409 }
    );
  }

  await deleteShift(params.id);
  return NextResponse.json({ ok: true });
}
