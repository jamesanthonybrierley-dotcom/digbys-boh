import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { findEntryById, updateEntry, deleteEntry } from "@/lib/queries/timeEntries";

const patchSchema = z.object({
  clockIn: z.string().min(1).optional(),
  clockOut: z.string().min(1).optional().nullable().or(z.literal("")),
  breakMinutes: z.coerce.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findEntryById(params.id);
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
  const entry = await updateEntry(params.id, {
    ...(d.clockIn !== undefined && { clockIn: d.clockIn }),
    ...(d.clockOut !== undefined && { clockOut: d.clockOut || null }),
    ...(d.breakMinutes !== undefined && { breakMinutes: d.breakMinutes }),
    ...(d.notes !== undefined && { notes: d.notes || null }),
  });

  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const existing = await findEntryById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteEntry(params.id);
  return NextResponse.json({ ok: true });
}
