"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTimeRange, formatTimeLondon } from "@/lib/utils";
import type { Shift } from "@/types";

function elapsed(clockInIso: string, now: number): string {
  const ms = Math.max(0, now - new Date(clockInIso).getTime());
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function TimeClockPanel({
  todaysShifts,
  openEntry,
  openEntryShift,
}: {
  todaysShifts: Shift[];
  openEntry: { id: string; clockIn: string } | null;
  openEntryShift: Shift | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!openEntry) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [openEntry]);

  async function clockIn(shiftId: string) {
    setLoading(shiftId);
    setError(null);
    try {
      const res = await fetch("/api/time-entries/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't clock in");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(null);
    }
  }

  async function clockOut() {
    setLoading("out");
    setError(null);
    try {
      const res = await fetch("/api/time-entries/clock-out", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't clock out");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(null);
    }
  }

  if (openEntry && openEntryShift) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-medium text-brand-700">Clocked in</p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums text-ink-900">
          {elapsed(openEntry.clockIn, now)}
        </p>
        <p className="mt-1 text-sm text-ink-500">
          {openEntryShift.title} · since {formatTimeLondon(openEntry.clockIn)}
        </p>
        <Button
          variant="destructive"
          size="lg"
          onClick={clockOut}
          loading={loading === "out"}
          className="mt-5 w-full"
        >
          <Square className="h-4 w-4" /> Clock out
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>
    );
  }

  if (todaysShifts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-ink-500">No shift scheduled for you today.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {todaysShifts.map((s) => (
        <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{s.title}</p>
            <p className="truncate text-sm text-ink-400">
              {formatTimeRange(s.startTime, s.endTime)} · {s.location}
            </p>
          </div>
          <Button onClick={() => clockIn(s.id)} loading={loading === s.id}>
            <Play className="h-4 w-4" /> Clock in
          </Button>
        </Card>
      ))}
    </div>
  );
}
