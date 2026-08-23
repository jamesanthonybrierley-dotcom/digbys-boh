"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, timeOffStatusTone } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { TimeOffRequest } from "@/types";

export function TimeOffRow({
  request,
  personName,
  canDecide,
  canCancel,
}: {
  request: TimeOffRequest;
  personName?: string;
  canDecide: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(status: "APPROVED" | "DECLINED") {
    setLoading(status);
    try {
      await fetch(`/api/time-off/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    try {
      await fetch(`/api/time-off/${request.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        {personName && <p className="text-sm font-medium text-ink-900">{personName}</p>}
        <p className="text-sm text-ink-600">
          {formatDate(request.startDate)} – {formatDate(request.endDate)}
        </p>
        {request.reason && <p className="mt-0.5 truncate text-sm text-ink-400">{request.reason}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge tone={timeOffStatusTone(request.status)}>
          {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
        </Badge>
        {canDecide && request.status === "PENDING" && (
          <>
            <button
              onClick={() => decide("APPROVED")}
              disabled={!!loading}
              aria-label="Approve"
              className="focus-ring rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => decide("DECLINED")}
              disabled={!!loading}
              aria-label="Decline"
              className="focus-ring rounded-lg p-1.5 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
        {canCancel && request.status === "PENDING" && (
          <button
            onClick={cancel}
            disabled={!!loading}
            aria-label="Cancel request"
            className="focus-ring rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
