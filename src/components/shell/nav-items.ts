import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Repeat,
  PartyPopper,
  Users,
  Wallet,
  CalendarOff,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/timeclock", label: "Time Clock", icon: Clock },
  { href: "/shifts/open", label: "Open Shifts", icon: Repeat },
  { href: "/events", label: "Events", icon: PartyPopper },
  { href: "/staff", label: "Staff", icon: Users, adminOnly: true },
  { href: "/timesheets", label: "Timesheets", icon: Wallet },
  { href: "/time-off", label: "Time Off", icon: CalendarOff },
  { href: "/profile", label: "Profile", icon: User },
];

export const MOBILE_TAB_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/timeclock", label: "Clock", icon: Clock },
  { href: "/shifts/open", label: "Shifts", icon: Repeat },
];
