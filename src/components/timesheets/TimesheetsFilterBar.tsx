"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { addDaysToIsoDate, formatDateShort, todayIsoDate, startOfWeekIso } from "@/lib/utils";

export function TimesheetsFilterBar({
  weekStart,
  staffId,
  staffOptions,
  isAdmin,
}: {
  weekStart: string;
  staffId: string;
  staffOptions: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const weekEnd = addDaysToIsoDate(weekStart, 6);
  const isCurrentWeek = weekStart === startOfWeekIso(todayIsoDate());

  function navigate(newWeek: string, newStaff: string) {
    const params = new URLSearchParams();
    if (newWeek) params.set("week", newWeek);
    if (newStaff) params.set("staff", newStaff);
    const qs = params.toString();
    router.push(`/timesheets${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(addDaysToIsoDate(weekStart, -7), staffId)}
          aria-label="Previous week"
          className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-ink-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="px-1 text-center">
          <p className="text-sm font-medium text-ink-900">
            {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
          </p>
          {!isCurrentWeek && (
            <button
              onClick={() => navigate("", staffId)}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              This week
            </button>
          )}
        </div>
        <button
          onClick={() => navigate(addDaysToIsoDate(weekStart, 7), staffId)}
          aria-label="Next week"
          className="focus-ring rounded-lg p-2 text-ink-500 hover:bg-ink-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <select
            value={staffId}
            onChange={(e) => navigate(weekStart, e.target.value)}
            className="focus-ring rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm text-ink-700"
          >
            <option value="">Everyone</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {isAdmin && (
          <a
            href={`/api/time-entries/export?week=${weekStart}${staffId ? `&staff=${staffId}` : ""}`}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        )}
      </div>
    </div>
  );
}
