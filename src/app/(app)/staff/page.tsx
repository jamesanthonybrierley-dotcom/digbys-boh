import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/queries/users";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { NewStaffButton } from "@/components/staff/NewStaffButton";
import { formatCurrencyFromPence, cn } from "@/lib/utils";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireAdmin();
  const staff = await listUsers({ includeInactive: true });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewStaffButton />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <Link key={s.id} href={`/staff/${s.id}`}>
            <Card className={cn("h-full p-4 transition hover:border-ink-200 hover:shadow-pop", !s.active && "opacity-50")}>
              <div className="flex items-center gap-3">
                <Avatar name={s.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{s.name}</p>
                  <p className="truncate text-sm text-ink-400">
                    {s.position || (s.role === "ADMIN" ? "Admin" : "Staff")}
                  </p>
                </div>
                {s.role === "ADMIN" && <Badge tone="brand">Admin</Badge>}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-500">{formatCurrencyFromPence(s.hourlyRatePence)}/hr</span>
                {!s.active && <Badge tone="neutral">Inactive</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
