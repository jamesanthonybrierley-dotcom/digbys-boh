import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { findUserById } from "@/lib/queries/users";
import { listShifts } from "@/lib/queries/shifts";
import { listEntriesForLondonRange } from "@/lib/queries/timeEntries";
import { StaffEditForm } from "@/components/staff/StaffEditForm";
import { ResetPasswordButton } from "@/components/staff/ResetPasswordButton";
import { ShiftCard } from "@/components/shifts/ShiftCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { entryHours } from "@/lib/pay";
import { formatCurrencyFromPence, todayIsoDate, startOfWeekIso } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await findUserById(params.id);
  return { title: person ? person.name : "Staff" };
}

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const person = await findUserById(params.id);
  if (!person) notFound();

  const today = todayIsoDate();
  const [upcomingAll, weekEntries] = await Promise.all([
    listShifts({ assignedUserId: person.id, dateFrom: today }),
    listEntriesForLondonRange({
      userId: person.id,
      startDate: startOfWeekIso(today),
      endDate: today,
    }),
  ]);
  const upcoming = upcomingAll.slice(0, 5);
  const hoursThisWeek = weekEntries.reduce((sum, e) => sum + entryHours(e), 0);
  const payThisWeek = person.hourlyRatePence != null ? hoursThisWeek * person.hourlyRatePence : null;

  return (
    <div className="space-y-5">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> All staff
      </Link>

      <StaffEditForm staff={person} isSelf={person.id === admin.id} />

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardBody>
          <ResetPasswordButton userId={person.id} />
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
          </CardHeader>
          <CardBody className="space-y-1 text-sm text-ink-600">
            <p>{hoursThisWeek.toFixed(1)} hours logged</p>
            {payThisWeek != null && (
              <p>{formatCurrencyFromPence(Math.round(payThisWeek))} earned so far</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming shifts</CardTitle>
          </CardHeader>
          <CardBody>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-400">Nothing scheduled.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <ShiftCard key={s.id} shift={s} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
