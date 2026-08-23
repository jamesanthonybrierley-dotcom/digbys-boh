import { requireUser } from "@/lib/auth";
import { listShifts } from "@/lib/queries/shifts";
import { listUsers } from "@/lib/queries/users";
import { listEvents } from "@/lib/queries/events";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { AdminShiftList } from "@/components/shifts/AdminShiftList";
import { ReleaseShiftButton } from "@/components/shifts/ReleaseShiftButton";
import { ScheduleWeekNav } from "@/components/schedule/ScheduleWeekNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";
import { addDaysToIsoDate, startOfWeekIso, todayIsoDate, formatWeekday, formatDateShort } from "@/lib/utils";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const user = await requireUser();
  const weekStart =
    searchParams.week && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week)
      ? searchParams.week
      : startOfWeekIso(todayIsoDate());
  const weekEnd = addDaysToIsoDate(weekStart, 6);

  const [shifts, allUsers, allEvents] = await Promise.all([
    listShifts({
      dateFrom: weekStart,
      dateTo: weekEnd,
      assignedUserId: user.role === "ADMIN" ? undefined : user.id,
    }),
    listUsers({ includeInactive: true }),
    listEvents(),
  ]);
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const eventMap = new Map(allEvents.map((e) => [e.id, e.name]));

  const withNames = shifts.map((s) => ({
    ...s,
    assignedUserName: s.assignedUserId ? userMap.get(s.assignedUserId) ?? "Unknown" : null,
    eventName: s.eventId ? eventMap.get(s.eventId) ?? null : null,
  }));

  const byDate = new Map<string, typeof withNames>();
  for (const s of withNames) {
    const list = byDate.get(s.shiftDate) ?? [];
    list.push(s);
    byDate.set(s.shiftDate, list);
  }
  const days = Array.from({ length: 7 }, (_, i) => addDaysToIsoDate(weekStart, i));

  const staffOptions = allUsers.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }));
  const eventOptions = allEvents.map((e) => ({
    id: e.id,
    name: e.name,
    location: e.location,
    eventDate: e.eventDate,
  }));

  return (
    <div className="space-y-4">
      <ScheduleWeekNav weekStart={weekStart} />

      {user.role === "ADMIN" ? (
        <AdminShiftList
          shifts={withNames}
          staffOptions={staffOptions}
          eventOptions={eventOptions}
          defaultDate={todayIsoDate()}
          emptyLabel="No shifts scheduled this week"
        />
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No shifts this week"
          description="Check Open Shifts if you'd like to pick one up."
        />
      ) : (
        <div className="space-y-4">
          {days
            .filter((d) => byDate.has(d))
            .map((d) => (
              <div key={d}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {formatWeekday(d)}, {formatDateShort(d)}
                </p>
                <div className="space-y-2">
                  {byDate.get(d)!.map((s) => (
                    <ShiftCard
                      key={s.id}
                      shift={s}
                      eventName={s.eventName}
                      actions={
                        s.assignedUserId === user.id ? (
                          <ReleaseShiftButton shiftId={s.id} />
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
