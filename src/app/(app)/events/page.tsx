import Link from "next/link";
import { PartyPopper, MapPin, Users as UsersIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listEvents } from "@/lib/queries/events";
import { Card } from "@/components/ui/Card";
import { Badge, eventStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewEventButton } from "@/components/events/NewEventButton";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { all?: string };
}) {
  const user = await requireUser();
  const showAll = searchParams.all === "1";
  const events = showAll ? await listEvents() : await listEvents({ upcomingOnly: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={showAll ? "/events" : "/events?all=1"}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {showAll ? "Show upcoming only" : "Show all events"}
        </Link>
        {user.role === "ADMIN" && <NewEventButton />}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No events yet"
          description={
            user.role === "ADMIN"
              ? "Create your first event to start scheduling shifts."
              : "Nothing scheduled yet."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="h-full p-4 transition hover:border-ink-200 hover:shadow-pop">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-semibold text-ink-900">{e.name}</p>
                  <Badge tone={eventStatusTone(e.status)}>
                    {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                {e.clientName && <p className="mt-0.5 text-sm text-ink-400">{e.clientName}</p>}
                <div className="mt-3 space-y-1 text-sm text-ink-600">
                  <p>{formatDate(e.eventDate)}</p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                    <span className="truncate">{e.location}</span>
                  </p>
                  {e.guestCount != null && (
                    <p className="flex items-center gap-1.5">
                      <UsersIcon className="h-3.5 w-3.5 shrink-0 text-ink-300" /> {e.guestCount} guests
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
