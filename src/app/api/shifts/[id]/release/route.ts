import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { releaseShift, findShiftById } from "@/lib/queries/shifts";
import { notifyAdmins, notifyAllActive } from "@/lib/queries/notifications";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const before = await findShiftById(params.id);
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwn = before.assignedUserId === viewer.id;
  if (!isOwn && viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const shift = await releaseShift(params.id, viewer.id, viewer.role === "ADMIN");
  if (!shift) {
    return NextResponse.json({ error: "Couldn't release that shift" }, { status: 409 });
  }

  if (isOwn) {
    await notifyAdmins({
      type: "SHIFT_RELEASED",
      title: `${viewer.name} released a shift`,
      body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime} is back up for grabs`,
      link: "/shifts/open",
    });
  }

  await notifyAllActive(
    {
      type: "SHIFT_OPEN",
      title: "A shift is up for grabs",
      body: `${shift.title} · ${shift.shiftDate} ${shift.startTime}-${shift.endTime} at ${shift.location}`,
      link: "/shifts/open",
    },
    viewer.id
  );

  return NextResponse.json({ shift });
}
