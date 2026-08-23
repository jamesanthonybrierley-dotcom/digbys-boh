import Link from "next/link";
import {
  CalendarDays,
  Repeat,
  PoundSterling,
  Clock as ClockIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listShifts } from "@/lib/queries/shifts";
import { listEvents } from "@/lib/queries/events";
import { listUsers } from "@/lib/queries/users";
import {
  countOpenEntries,
  listEntriesForLondonRange,
  findOpenEntryForUser,
} from "@/lib/queries/timeEntries";
import { listTimeOff } from "@/lib/queries/timeOff";
import { findEventById } from "@/lib/queries/events";
import { scheduledHours, entryHours } from "@/lib/pay";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { Badge, shiftStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatCurrencyFromPence,
  formatDate,
  formatTimeRange,
  todayIsoDate,
  addDaysToIsoDate,
  startOfWeekIso,
} from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayIsoDate();

  if (user.role === "ADMIN") {
    const weekStart = startOfWeekIso(today);
    const weekEnd = addDaysToIsoDate(weekStart, 6);

    const [todaysShifts, openUpcoming, upcomingEventsAll, clockedIn, pendingTimeOff, weekShifts, allUsers] =
      await Promise.all([
        listShifts({ dateFrom: today, dateTo: today }),
        listShifts({ status: "OPEN", dateFrom: today }),
        listEvents({ upcomingOnly: true }),
        countOpenEntries(),
        listTimeOff({ status: "PENDING" }),
        listShifts({ dateFrom: weekStart, dateTo: weekEnd, status: "ASSIGNED" }),
        listUsers({ includeInactive: true }),
      ]);
    const upcomingEvents = upcomingEventsAll.slice(0, 5);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    let projectedCostPence = 0;
    for (const s of weekShifts) {
      if (!s.assignedUserId) continue;
      const person = userMap.get(s.assignedUserId);
      if (!person?.hourlyRatePence) continue;
      projectedCostPence += scheduledHours(s.startTime, s.endTime) * person.hourlyRatePence;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Today's shifts" value={String(todaysShifts.length)} icon={CalendarDays} tone="brand" />
          <StatCard label="Clocked in now" value={String(clockedIn)} icon={ClockIcon} tone="brand" />
          <StatCard label="Open shifts" value={String(openUpcoming.length)} icon={Repeat} tone="amber" />
          <StatCard
            label="This week's labour"
            value={formatCurrencyFromPence(Math.round(projectedCostPence))}
            icon={PoundSterling}
            hint="Scheduled, not actual"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s schedule</CardTitle>
            <Link href="/schedule" className="text-sm font-medium text-brand-700 hover:underline">
              View full schedule
            </Link>
          </CardHeader>
          <CardBody>
            {todaysShifts.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing scheduled today" />
            ) : (
              <div className="space-y-2">
                {todaysShifts.map((s) => {
                  const person = s.assignedUserId ? userMap.get(s.assignedUserId) : null;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{s.title}</p>
                        <p className="truncate text-xs text-ink-400">
                          {formatTimeRange(s.startTime, s.endTime)} · {s.location}
                        </p>
                      </div>
                      <Badge tone={shiftStatusTone(s.status)}>{person ? person.name : "Open"}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending time off</CardTitle>
              <Link href="/time-off" className="text-sm font-medium text-brand-700 hover:underline">
                Review
              </Link>
            </CardHeader>
            <CardBody>
              {pendingTimeOff.length === 0 ? (
                <p className="text-sm text-ink-400">Nothing waiting on you.</p>
              ) : (
                <div className="space-y-2">
                  {pendingTimeOff.slice(0, 4).map((r) => {
                    const person = userMap.get(r.userId);
                    return (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink-700">{person?.name ?? "Unknown"}</span>
                        <span className="text-ink-400">
                          {formatDate(r.startDate)} – {formatDate(r.endDate)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
              <Link href="/events" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardBody>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-ink-400">No upcoming events yet.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/${e.id}`}
                      className="flex items-center justify-between text-sm hover:text-brand-700"
                    >
                      <span className="text-ink-700">{e.name}</span>
                      <span className="text-ink-400">{formatDate(e.eventDate)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Staff dashboard
  const weekStart = startOfWeekIso(today);
  const [myUpcoming, myWeekEntries, allOpen, currentlyOn] = await Promise.all([
    listShifts({ assignedUserId: user.id, dateFrom: today }),
    listEntriesForLondonRange({ userId: user.id, startDate: weekStart, endDate: today }),
    listShifts({ status: "OPEN", dateFrom: today }),
    findOpenEntryForUser(user.id),
  ]);
  const nextShift = myUpcoming[0];
  const nextShiftEvent = nextShift?.eventId ? await findEventById(nextShift.eventId) : null;
  const hoursThisWeek = myWeekEntries.reduce((sum, e) => sum + entryHours(e), 0);
  const openTeaser = allOpen.slice(0, 3);

  return (
    <div className="space-y-6">
      {currentlyOn && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm font-medium text-brand-800">You&apos;re currently clocked in.</p>
          <Link href="/timeclock">
            <Button size="sm" variant="secondary">
              Go to Time Clock
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Hours this week" value={hoursThisWeek.toFixed(1)} icon={ClockIcon} tone="brand" />
        <StatCard label="Upcoming shifts" value={String(myUpcoming.length)} icon={CalendarDays} />
        <StatCard label="Open shifts" value={String(allOpen.length)} icon={Repeat} tone="amber" />
      </div>

      <div>
        <h2 className="mb-2 font-display text-base font-semibold text-ink-900">Your next shift</h2>
        {nextShift ? (
          <ShiftCard shift={nextShift} eventName={nextShiftEvent?.name} />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming shifts"
            description="Check Open Shifts to pick one up."
            action={
              <Link href="/shifts/open">
                <Button size="sm">Browse open shifts</Button>
              </Link>
            }
          />
        )}
      </div>

      {openTeaser.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink-900">Up for grabs</h2>
            <Link href="/shifts/open" className="text-sm font-medium text-brand-700 hover:underline">
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {openTeaser.map((s) => (
              <ShiftCard key={s.id} shift={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
