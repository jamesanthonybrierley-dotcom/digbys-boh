import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function MustChangePasswordBanner() {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <ShieldAlert className="h-5 w-5 shrink-0" />
      <p className="flex-1">You&apos;re using a temporary password. Please set your own to continue.</p>
      <Link href="/profile" className="font-medium underline underline-offset-2">
        Set password
      </Link>
    </div>
  );
}
