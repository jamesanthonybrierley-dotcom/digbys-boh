import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Users as UsersIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { findEventById } from "@/lib/queries/events";
import { listShifts } from "@/lib/queries/shifts";
import { listUsers } from "@/lib/queries/users";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, eventStatusTone } from "@/components/ui/Badge";
import { AdminShiftList } from "@/components/shifts/AdminShiftList";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { ReleaseShiftButton } from "@/components/shifts/ReleaseShiftButton";
import { EditEventButton } from "@/components/events/EditEventButton";
import { formatDate, formatTimeRange } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await findEventById(params.id);
  return { title: event ? event.name : "Event" };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const event = await findEventById(params.id);
  if (!event) notFound();

  const [shifts, allUsers] = await Promise.all([
    listShifts({ eventId: params.id }),
    listUsers({ includeInactive: true }),
  ]);
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const staffOptions = allUsers.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }));

  const withNames = shifts.map((s) => ({
    ...s,
    assignedUserName: s.assignedUserId ? userMap.get(s.assignedUserId) ?? "Unknown" : null,
  }));

  return (
    <div className="space-y-5">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <Card>
        <CardBody className="pt-4 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">{event.name}</h2>
              {event.clientName && <p className="text-sm text-ink-400">{event.clientName}</p>}
            </div>
            <Badge tone={eventStatusTone(event.status)}>
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-ink-600 sm:grid-cols-2">
            <p>
              {formatDate(event.eventDate)}
              {event.startTime && ` · ${formatTimeRange(event.startTime, event.endTime ?? "")}`}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-ink-300" /> {event.location}
            </p>
            {event.address && <p className="text-ink-400 sm:col-span-2">{event.address}</p>}
            {event.guestCount != null && (
              <p className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4 shrink-0 text-ink-300" /> {event.guestCount} guests
              </p>
            )}
          </div>
          {event.notes && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink-600">{event.notes}</p>
          )}
          {user.role === "ADMIN" && (
            <div className="mt-4">
              <EditEventButton event={event} />
            </div>
          )}
        </CardBody>
      </Card>

      <div>
        <h3 className="mb-2 font-display text-base font-semibold text-ink-900">
          Shifts for this event
        </h3>
        {user.role === "ADMIN" ? (
          <AdminShiftList
            shifts={withNames}
            staffOptions={staffOptions}
            eventOptions={[
              {
                id: event.id,
                name: event.name,
                location: event.location,
                eventDate: event.eventDate,
              },
            ]}
            defaultEventId={event.id}
            defaultDate={event.eventDate}
            emptyLabel="No shifts added yet"
          />
        ) : shifts.length === 0 ? (
          <p className="text-sm text-ink-400">No shifts added yet.</p>
        ) : (
          <div className="space-y-2">
            {withNames.map((s) => (
              <ShiftCard
                key={s.id}
                shift={s}
                assignedUserName={s.assignedUserName}
                actions={
                  s.assignedUserId === user.id ? <ReleaseShiftButton shiftId={s.id} /> : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
