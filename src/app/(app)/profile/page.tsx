import { requireUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { formatCurrencyFromPence } from "@/lib/utils";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="pt-4 sm:pt-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold text-ink-900">{user.name}</p>
              <p className="truncate text-sm text-ink-400">{user.email}</p>
            </div>
            {user.role === "ADMIN" && <Badge tone="brand">Admin</Badge>}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-400">Position</dt>
              <dd className="text-ink-800">{user.position || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Phone</dt>
              <dd className="text-ink-800">{user.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Hourly rate</dt>
              <dd className="text-ink-800">{formatCurrencyFromPence(user.hourlyRatePence)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-400">
            Only you and admins can see your rate. Ask an admin to update your details.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardBody>
          <ChangePasswordForm forced={user.mustChangePassword} />
        </CardBody>
      </Card>
    </div>
  );
}
