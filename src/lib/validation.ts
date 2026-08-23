import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  role: z.enum(["ADMIN", "STAFF"]),
  position: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).max(500).optional().nullable(),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().min(1).email().optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  position: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).max(500).optional().nullable(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Use at least 8 characters"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Use at least 8 characters").optional(),
});

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(150),
  clientName: z.string().max(150).optional().or(z.literal("")),
  location: z.string().min(1, "Location is required").max(200),
  address: z.string().max(300).optional().or(z.literal("")),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
  guestCount: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
});

export const shiftSchema = z.object({
  eventId: z.string().uuid().optional().nullable().or(z.literal("")),
  title: z.string().min(1, "Give this shift a title").max(120),
  location: z.string().min(1, "Location is required").max(200),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  assignedUserId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export const timeOffSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export const decideTimeOffSchema = z.object({
  status: z.enum(["APPROVED", "DECLINED"]),
});

export const manualTimeEntrySchema = z.object({
  shiftId: z.string().uuid(),
  userId: z.string().uuid(),
  clockIn: z.string().min(1, "Clock-in time is required"),
  clockOut: z.string().min(1).optional().nullable().or(z.literal("")),
  breakMinutes: z.coerce.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});
