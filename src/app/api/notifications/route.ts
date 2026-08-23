import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, unreadCount, markAllRead } from "@/lib/queries/notifications";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("countOnly") === "1") {
    return NextResponse.json({ unread: await unreadCount(viewer.id) });
  }

  const [notifications, unread] = await Promise.all([
    listNotifications(viewer.id),
    unreadCount(viewer.id),
  ]);
  return NextResponse.json({ notifications, unread });
}

export async function PATCH() {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await markAllRead(viewer.id);
  return NextResponse.json({ ok: true });
}
