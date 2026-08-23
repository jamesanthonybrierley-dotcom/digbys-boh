import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findOpenEntryForUser, clockOut } from "@/lib/queries/timeEntries";

export async function POST() {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const open = await findOpenEntryForUser(viewer.id);
  if (!open) return NextResponse.json({ error: "You're not clocked in" }, { status: 409 });

  const entry = await clockOut(open.id);
  return NextResponse.json({ entry });
}
