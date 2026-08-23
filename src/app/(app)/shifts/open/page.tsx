import { requireUser } from "@/lib/auth";
import { listShifts } from "@/lib/queries/shifts";
import { listEvents } from "@/lib/queries/events";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { ClaimShiftButton } from "@/components/shifts/ClaimShiftButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Repeat } from "lucide-react";
import { todayIsoDate } from "@/lib/utils";

export const metadata = { title: "Open Shifts" };

export default async function OpenShiftsPage() {
  await requireUser();
  const [shifts, events] = await Promise.all([
    listShifts({ status: "OPEN", dateFrom: todayIsoDate() }),
    listEvents(),
  ]);
  const eventMap = new Map(events.map((e) => [e.id, e.name]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-500">
        Shifts nobody&apos;s covering yet. First to claim gets it.
      </p>
      {shifts.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No open shifts right now"
          description="Check back later, or ask your manager."
        />
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => (
            <ShiftCard
              key={s.id}
              shift={s}
              eventName={s.eventId ? eventMap.get(s.eventId) : null}
              actions={<ClaimShiftButton shiftId={s.id} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
