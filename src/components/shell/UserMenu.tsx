"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

export function UserMenu({
  user,
  variant = "sidebar",
}: {
  user: User;
  variant?: "sidebar" | "compact" | "list";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  if (variant === "list") {
    return (
      <div className="space-y-0.5">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-700 hover:bg-ink-100"
        >
          <Avatar name={user.name} size="sm" />
          <span>
            <span className="block">{user.name}</span>
            <span className="block text-xs font-normal text-ink-400">
              {user.role === "ADMIN" ? "Admin" : "Staff"}
            </span>
          </span>
        </Link>
        <button
          onClick={signOut}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="focus-ring rounded-full">
          <Avatar name={user.name} size="sm" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-ink-100 bg-white p-1.5 shadow-pop">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
                <p className="truncate text-xs text-ink-400">{user.email}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-100"
              >
                Profile
              </Link>
              <button
                onClick={signOut}
                disabled={loading}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-ink-100"
      >
        <Avatar name={user.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink-900">{user.name}</span>
          <span className="block truncate text-xs text-ink-400">
            {user.role === "ADMIN" ? "Admin" : "Staff"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-2 w-full rounded-xl border border-ink-100 bg-white p-1.5 shadow-pop">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-100"
            >
              Profile & password
            </Link>
            <button
              onClick={signOut}
              disabled={loading}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
