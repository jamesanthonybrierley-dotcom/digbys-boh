import { requireUser } from "@/lib/auth";
import { listShifts, findShiftById } from "@/lib/queries/shifts";
import { findOpenEntryForUser, listEntries } from "@/lib/queries/timeEntries";
import { TimeClockPanel } from "@/components/timeclock/TimeClockPanel";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { entryHours } from "@/lib/pay";
import { formatDateTimeLondon, todayIsoDate } from "@/lib/utils";

export const metadata = { title: "Time Clock" };

export default async function TimeClockPage() {
  const user = await requireUser();
  const today = todayIsoDate();

  const [todaysShifts, openEntry, recentAll] = await Promise.all([
    listShifts({ assignedUserId: user.id, dateFrom: today, dateTo: today }),
    findOpenEntryForUser(user.id),
    listEntries({ userId: user.id }),
  ]);
  const openEntryShift = openEntry ? await findShiftById(openEntry.shiftId) : null;
  const recent = recentAll.slice(0, 8);

  return (
    <div className="space-y-5">
      <TimeClockPanel
        todaysShifts={openEntry ? [] : todaysShifts}
        openEntry={openEntry}
        openEntryShift={openEntryShift}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardBody>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-400">No time logged yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">{formatDateTimeLondon(e.clockIn)}</span>
                  <span className="text-ink-400">
                    {e.clockOut ? `${entryHours(e).toFixed(1)}h` : "In progress"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
