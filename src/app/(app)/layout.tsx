import { requireUser } from "@/lib/auth";
import { unreadCount } from "@/lib/queries/notifications";
import { AppShell } from "@/components/shell/AppShell";
import { MustChangePasswordBanner } from "@/components/shell/MustChangePasswordBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await unreadCount(user.id);

  return (
    <AppShell user={user} initialUnread={unread}>
      {user.mustChangePassword && <MustChangePasswordBanner />}
      {children}
    </AppShell>
  );
}
