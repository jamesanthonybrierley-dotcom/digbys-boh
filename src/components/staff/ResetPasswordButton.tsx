"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function reset() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setTempPassword(data.tempPassword);
      setLoading(false);
      setConfirming(false);
    } catch {
      setLoading(false);
    }
  }

  async function copy() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the password is still visible to copy by hand
    }
  }

  if (tempPassword) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
          New temporary password
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-base font-semibold text-ink-900">{tempPassword}</p>
          <button
            onClick={copy}
            className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
            aria-label="Copy password"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-400">Shown once — share it with them now.</p>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" onClick={reset} loading={loading}>
          Confirm reset
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
      <KeyRound className="h-4 w-4" /> Reset password
    </Button>
  );
}
