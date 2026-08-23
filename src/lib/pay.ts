import { minutesBetween } from "./utils";
import type { TimeEntry } from "@/types";

export function entryHours(
  entry: Pick<TimeEntry, "clockIn" | "clockOut" | "breakMinutes">
): number {
  if (!entry.clockOut) return 0;
  const grossMinutes = minutesBetween(entry.clockIn, entry.clockOut);
  const netMinutes = Math.max(0, grossMinutes - (entry.breakMinutes ?? 0));
  return netMinutes / 60;
}

export function entryPayPence(
  entry: Pick<TimeEntry, "clockIn" | "clockOut" | "breakMinutes">,
  hourlyRatePence: number | null
): number {
  if (hourlyRatePence == null) return 0;
  return Math.round(entryHours(entry) * hourlyRatePence);
}

/** Scheduled duration of a shift in hours, from 24h "HH:MM" strings. Handles overnight shifts. */
export function scheduledHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}
