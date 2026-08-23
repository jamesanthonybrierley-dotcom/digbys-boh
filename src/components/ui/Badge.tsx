import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "amber" | "green" | "red" | "blue";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  brand: "bg-brand-100 text-brand-800",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function shiftStatusTone(status: string): Tone {
  switch (status) {
    case "OPEN":
      return "amber";
    case "ASSIGNED":
      return "brand";
    case "COMPLETED":
      return "neutral";
    case "CANCELLED":
      return "red";
    default:
      return "neutral";
  }
}

export function timeOffStatusTone(status: string): Tone {
  switch (status) {
    case "PENDING":
      return "amber";
    case "APPROVED":
      return "green";
    case "DECLINED":
      return "red";
    default:
      return "neutral";
  }
}

export function eventStatusTone(status: string): Tone {
  switch (status) {
    case "CONFIRMED":
      return "brand";
    case "DRAFT":
      return "neutral";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    default:
      return "neutral";
  }
}
