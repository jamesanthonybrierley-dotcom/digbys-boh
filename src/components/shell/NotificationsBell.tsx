"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDateTimeLondon } from "@/lib/utils";
import type { AppNotification } from "@/types";

export function NotificationsBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications?countOnly=1");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.unread);
        }
      } catch {
        // ignore transient network errors while polling
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (next && !items) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setItems(data.notifications ?? []);
        setUnread(0);
        fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
      } finally {
        setLoading(false);
      }
    } else if (next) {
      setUnread(0);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={openPanel}
        aria-label="Notifications"
        className="focus-ring relative rounded-full p-2 text-ink-500 hover:bg-ink-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-ink-100 bg-white p-2 shadow-pop">
            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Notifications
            </p>
            {loading && <p className="px-2 py-4 text-center text-sm text-ink-400">Loading…</p>}
            {!loading && items && items.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-ink-400">You&apos;re all caught up.</p>
            )}
            {!loading &&
              items?.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2.5 py-2 text-sm hover:bg-ink-100"
                >
                  <p className="font-medium text-ink-900">{n.title}</p>
                  {n.body && <p className="text-xs text-ink-500">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-ink-300">
                    {formatDateTimeLondon(n.createdAt)}
                  </p>
                </Link>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
