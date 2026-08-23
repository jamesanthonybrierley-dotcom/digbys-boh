"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

export function NewStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; email: string; tempPassword: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setRole("STAFF");
    setPosition("");
    setPhone("");
    setHourlyRate("");
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function handleClose() {
    const shouldRefresh = !!created;
    reset();
    onClose();
    if (shouldRefresh) router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          position,
          phone,
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setCreated({ name, email, tempPassword: data.tempPassword });
      setLoading(false);
    } catch {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the password is still visible to copy by hand
    }
  }

  if (created) {
    return (
      <Modal open={open} onClose={handleClose} title="Staff member added">
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            Share these sign-in details with <strong>{created.name}</strong>. This password is only
            shown once.
          </p>
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Email</p>
            <p className="font-medium text-ink-900">{created.email}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              Temporary password
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-base font-semibold text-ink-900">{created.tempPassword}</p>
              <button
                onClick={copyPassword}
                className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                aria-label="Copy password"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-400">
            They&apos;ll be asked to set a new password the first time they sign in.
          </p>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add staff member">
      <form onSubmit={onSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Position"
            placeholder="e.g. Bartender"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Access level"
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")}
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
            hint="Only they and admins see this"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={loading} className="flex-1">
            Create login
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
