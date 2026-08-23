export type Role = "ADMIN" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string | null;
  hourlyRatePence: number | null;
  phone: string | null;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithSecret extends User {
  passwordHash: string;
}

export type EventStatus = "DRAFT" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface EventRecord {
  id: string;
  name: string;
  clientName: string | null;
  location: string;
  address: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  guestCount: number | null;
  notes: string | null;
  status: EventStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ShiftStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface Shift {
  id: string;
  eventId: string | null;
  title: string;
  location: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  status: ShiftStatus;
  assignedUserId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  shiftId: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  editedByAdmin: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TimeOffStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: TimeOffStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface SessionPayload {
  sub: string;
  role: Role;
  name: string;
  email: string;
}
