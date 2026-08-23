import { requireUser } from "@/lib/auth";
import { listEntriesForLondonRange } from "@/lib/queries/timeEntries";
import { listUsers } from "@/lib/queries/users";
import { entryHours, entryPayPence } from "@/lib/pay";
import { TimesheetsFilterBar } from "@/components/timesheets/TimesheetsFilterBar";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";
import {
  formatCurrencyFromPence,
  formatDateTimeLondon,
  addDaysToIsoDate,
  startOfWeekIso,
  todayIsoDate,
} from "@/lib/utils";

export const metadata = { title: "Timesheets" };

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: { week?: string; staff?: string };
}) {
  const user = await requireUser();
  const weekStart =
    searchParams.week && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week)
      ? searchParams.week
      : startOfWeekIso(todayIsoDate());
  const weekEnd = addDaysToIsoDate(weekStart, 6);

  const targetUserId = user.role === "ADMIN" ? searchParams.staff || undefined : user.id;
  const [entries, allStaffForLookup] = await Promise.all([
    listEntriesForLondonRange({
      userId: targetUserId,
      startDate: weekStart,
      endDate: weekEnd,
    }),
    listUsers({ includeInactive: true }),
  ]);
  const userMap = new Map(allStaffForLookup.map((u) => [u.id, u]));

  const staffOptions =
    user.role === "ADMIN" ? allStaffForLookup.map((u) => ({ id: u.id, name: u.name })) : [];

  let totalHours = 0;
  let totalPayPence = 0;
  const rows = entries.map((e) => {
    const person = userMap.get(e.userId);
    const hours = entryHours(e);
    const pay = person ? entryPayPence(e, person.hourlyRatePence) : 0;
    totalHours += hours;
    totalPayPence += pay;
    return {
      entry: e,
      personName: person?.name ?? "Unknown",
      hours,
      pay,
      hasRate: person?.hourlyRatePence != null,
    };
  });

  const showPay = user.role === "ADMIN" || rows.some((r) => r.hasRate);
  const showStaffColumn = user.role === "ADMIN" && !searchParams.staff;

  return (
    <div className="space-y-4">
      <TimesheetsFilterBar
        weekStart={weekStart}
        staffId={searchParams.staff ?? ""}
        staffOptions={staffOptions}
        isAdmin={user.role === "ADMIN"}
      />

      <div className="grid grid-cols-2 gap-3 sm:w-80">
        <Card className="p-4">
          <p className="text-sm text-ink-400">Total hours</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink-900">
            {totalHours.toFixed(1)}
          </p>
        </Card>
        {showPay && (
          <Card className="p-4">
            <p className="text-sm text-ink-400">Total pay</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink-900">
              {formatCurrencyFromPence(Math.round(totalPayPence))}
            </p>
          </Card>
        )}
      </div>

      <Card>
        <CardBody className="pt-4 sm:pt-5">
          {rows.length === 0 ? (
            <EmptyState icon={Wallet} title="No hours logged this week" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {showStaffColumn && <th className="py-2 pr-3">Staff</th>}
                    <th className="py-2 pr-3">Clock in</th>
                    <th className="py-2 pr-3">Clock out</th>
                    <th className="py-2 pr-3">Break</th>
                    <th className="py-2 pr-3">Hours</th>
                    {showPay && <th className="py-2 pr-3">Pay</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ entry, personName, hours, pay, hasRate }) => (
                    <tr key={entry.id} className="border-b border-ink-50 last:border-0">
                      {showStaffColumn && (
                        <td className="py-2 pr-3 text-ink-700">{personName}</td>
                      )}
                      <td className="py-2 pr-3 text-ink-700">{formatDateTimeLondon(entry.clockIn)}</td>
                      <td className="py-2 pr-3 text-ink-700">
                        {entry.clockOut ? formatDateTimeLondon(entry.clockOut) : "In progress"}
                      </td>
                      <td className="py-2 pr-3 text-ink-500">{entry.breakMinutes}m</td>
                      <td className="py-2 pr-3 tabular-nums text-ink-700">{hours.toFixed(2)}</td>
                      {showPay && (
                        <td className="py-2 pr-3 tabular-nums text-ink-700">
                          {hasRate ? formatCurrencyFromPence(pay) : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
