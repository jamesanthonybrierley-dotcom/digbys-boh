import { MapPin, Clock as ClockIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, shiftStatusTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, formatTimeRange } from "@/lib/utils";
import type { Shift } from "@/types";

function statusLabel(status: Shift["status"]) {
  if (status === "OPEN") return "Up for grabs";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ShiftCard({
  shift,
  assignedUserName,
  eventName,
  actions,
}: {
  shift: Shift;
  assignedUserName?: string | null;
  eventName?: string | null;
  actions?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display font-semibold text-ink-900">{shift.title}</p>
          {eventName && <p className="truncate text-sm text-ink-400">{eventName}</p>}
        </div>
        <Badge tone={shiftStatusTone(shift.status)} className="shrink-0">
          {statusLabel(shift.status)}
        </Badge>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-ink-600">
        <p className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0 text-ink-300" />
          {formatDate(shift.shiftDate)} · {formatTimeRange(shift.startTime, shift.endTime)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-ink-300" />
          <span className="truncate">{shift.location}</span>
        </p>
      </div>
      {assignedUserName && (
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={assignedUserName} size="sm" />
          <span className="text-sm text-ink-700">{assignedUserName}</span>
        </div>
      )}
      {shift.notes && <p className="mt-2 text-sm text-ink-500">{shift.notes}</p>}
      {actions && <div className="mt-3">{actions}</div>}
    </Card>
  );
}
