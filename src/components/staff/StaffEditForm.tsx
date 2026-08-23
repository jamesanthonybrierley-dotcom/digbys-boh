"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";
import { penceToPounds } from "@/lib/utils";
import type { User, Role } from "@/types";

export function StaffEditForm({ staff, isSelf }: { staff: User; isSelf: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [position, setPosition] = useState(staff.position ?? "");
  const [phone, setPhone] = useState(staff.phone ?? "");
  const [role, setRole] = useState<Role>(staff.role);
  const [hourlyRate, setHourlyRate] = useState(
    staff.hourlyRatePence != null ? String(penceToPounds(staff.hourlyRatePence)) : ""
  );
  const [active, setActive] = useState(staff.active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          position,
          phone,
          role,
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
          active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setSaved(true);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody className="pt-4 sm:pt-5">
        <form onSubmit={onSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {saved && !error && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input label="Position" value={position} onChange={(e) => setPosition(e.target.value)} />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Select
              label="Access level"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isSelf}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </Select>
            <Input
              label="Hourly rate (£)"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(e) => setActive(e.target.checked)}
              className="focus-ring h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            Active (can sign in)
          </label>
          {isSelf && (
            <p className="text-xs text-ink-400">
              You can&apos;t change your own access level or deactivate yourself.
            </p>
          )}
          <Button type="submit" loading={loading}>
            Save changes
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
