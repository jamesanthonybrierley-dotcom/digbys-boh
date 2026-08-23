import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimShift, findShiftById } from "@/lib/queries/shifts";
import { notifyAdmins } from "@/lib/queries/notifications";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const before = await findShiftById(params.id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shift = await claimShift(params.id, viewer.id);
  if (!shift) {
    return NextResponse.json(
      { error: "That shift was just claimed by someone else." },
      { status: 409 }
    );
  }

  await notifyAdmins(
    {
      type: "SHIFT_CLAIMED",
      title: `${viewer.name} claimed a shift`,
      body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime}`,
      link: "/schedule",
    },
    viewer.role === "ADMIN" ? viewer.id : undefined
  );

  return NextResponse.json({ shift });
}
