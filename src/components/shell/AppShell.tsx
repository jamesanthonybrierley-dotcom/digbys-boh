"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, MOBILE_TAB_ITEMS } from "./nav-items";
import { NotificationsBell } from "./NotificationsBell";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export function AppShell({
  user,
  initialUnread,
  children,
}: {
  user: User;
  initialUnread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN");
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeLabel = visibleNav.find((item) => isActive(item.href))?.label ?? "Digbys BOH";

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-ink-100 bg-white md:flex md:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 font-display text-sm font-bold text-white">
            D
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-tight text-ink-900">
              Digbys BOH
            </p>
            <p className="text-xs text-ink-400">Staff portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {visibleNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <UserMenu user={user} variant="sidebar" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <h1 className="font-display text-lg font-semibold text-ink-900">{activeLabel}</h1>
          <div className="flex items-center gap-1.5">
            <NotificationsBell initialUnread={initialUnread} />
            <div className="md:hidden">
              <UserMenu user={user} variant="compact" />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-ink-100 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {MOBILE_TAB_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-ink-900" : "text-ink-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-brand-600")} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-400"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-pop animate-slide-up">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-base font-semibold text-ink-900">Menu</p>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="focus-ring rounded-full p-1.5 text-ink-400 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {visibleNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 border-t border-ink-100 pt-3">
              <UserMenu user={user} variant="list" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
