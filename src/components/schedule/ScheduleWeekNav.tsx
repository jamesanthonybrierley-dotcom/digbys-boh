"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysToIsoDate, formatDateShort, todayIsoDate, startOfWeekIso } from "@/lib/utils";

export function ScheduleWeekNav({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const weekEnd = addDaysToIsoDate(weekStart, 6);
  const isCurrentWeek = weekStart === startOfWeekIso(todayIsoDate());

  function go(offsetDays: number) {
    router.push(`/schedule?week=${addDaysToIsoDate(weekStart, offsetDays)}`);
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-3 py-2.5">
      <button
        onClick={() => go(-7)}
        aria-label="Previous week"
        className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-ink-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="text-center">
        <p className="text-sm font-medium text-ink-900">
          {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
        </p>
        {!isCurrentWeek && (
          <button
            onClick={() => router.push("/schedule")}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Back to this week
          </button>
        )}
      </div>
      <button
        onClick={() => go(7)}
        aria-label="Next week"
        className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-ink-100"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
