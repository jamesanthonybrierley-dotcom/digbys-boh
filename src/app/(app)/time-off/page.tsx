import { requireUser } from "@/lib/auth";
import { listTimeOff } from "@/lib/queries/timeOff";
import { findUserById } from "@/lib/queries/users";
import { RequestTimeOffButton } from "@/components/timeoff/RequestTimeOffButton";
import { TimeOffRow } from "@/components/timeoff/TimeOffRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarOff } from "lucide-react";

export const metadata = { title: "Time Off" };

export default async function TimeOffPage() {
  const user = await requireUser();
  const requests = user.role === "ADMIN" ? await listTimeOff() : await listTimeOff({ userId: user.id });
  const nameMap = new Map<string, string>();
  if (user.role === "ADMIN") {
    const uniqueUserIds = Array.from(new Set(requests.map((r) => r.userId)));
    const people = await Promise.all(uniqueUserIds.map((id) => findUserById(id)));
    people.forEach((p, i) => {
      if (p) nameMap.set(uniqueUserIds[i], p.name);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RequestTimeOffButton />
      </div>
      {requests.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No time off requests" />
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <TimeOffRow
              key={r.id}
              request={r}
              personName={user.role === "ADMIN" ? nameMap.get(r.userId) : undefined}
              canDecide={user.role === "ADMIN"}
              canCancel={r.userId === user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
