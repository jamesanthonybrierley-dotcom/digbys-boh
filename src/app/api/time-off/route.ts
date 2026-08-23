import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listTimeOff, createTimeOff } from "@/lib/queries/timeOff";
import { timeOffSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/queries/notifications";
import type { TimeOffStatus } from "@/types";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as TimeOffStatus | null) ?? undefined;

  const requests =
    viewer.role === "ADMIN"
      ? await listTimeOff({ status })
      : await listTimeOff({ userId: viewer.id, status });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = timeOffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  if (parsed.data.endDate < parsed.data.startDate) {
    return NextResponse.json(
      { error: "End date can't be before the start date" },
      { status: 400 }
    );
  }

  const record = await createTimeOff({
    userId: viewer.id,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    reason: parsed.data.reason || null,
  });

  await notifyAdmins({
    type: "TIME_OFF_REQUESTED",
    title: `${viewer.name} requested time off`,
    body: `${record.startDate} to ${record.endDate}`,
    link: "/time-off",
  });

  return NextResponse.json({ request: record }, { status: 201 });
}
