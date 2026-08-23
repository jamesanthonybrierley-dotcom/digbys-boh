"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ReleaseShiftButton({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/release`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't release this shift");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" onClick={release} loading={loading} className="flex-1">
          Confirm release
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button size="sm" variant="secondary" onClick={() => setConfirming(true)} className="w-full">
        Put up for grabs
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
