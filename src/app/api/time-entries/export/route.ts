import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listEntriesForLondonRange } from "@/lib/queries/timeEntries";
import { findUserById } from "@/lib/queries/users";
import { entryHours, entryPayPence } from "@/lib/pay";
import { addDaysToIsoDate, formatCurrencyFromPence } from "@/lib/utils";

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  const staffId = searchParams.get("staff") || undefined;
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return NextResponse.json({ error: "A valid week is required" }, { status: 400 });
  }
  const weekEnd = addDaysToIsoDate(week, 6);

  const entries = await listEntriesForLondonRange({ userId: staffId, startDate: week, endDate: weekEnd });

  const rows: string[][] = [
    ["Name", "Date", "Clock in", "Clock out", "Break (min)", "Hours", "Rate", "Pay"],
  ];
  for (const e of entries) {
    const person = await findUserById(e.userId);
    const hours = entryHours(e);
    const pay = person ? entryPayPence(e, person.hourlyRatePence) : 0;
    rows.push([
      person?.name ?? "Unknown",
      e.clockIn.slice(0, 10),
      e.clockIn,
      e.clockOut ?? "",
      String(e.breakMinutes),
      hours.toFixed(2),
      person?.hourlyRatePence != null ? formatCurrencyFromPence(person.hourlyRatePence) : "",
      person?.hourlyRatePence != null ? formatCurrencyFromPence(pay) : "",
    ]);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timesheet-${week}.csv"`,
    },
  });
}
