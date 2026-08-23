import type { User } from "@/types";

export function isAdmin(user: Pick<User, "role">): boolean {
  return user.role === "ADMIN";
}

export function canSeeRate(viewer: Pick<User, "id" | "role">, subjectUserId: string): boolean {
  return viewer.role === "ADMIN" || viewer.id === subjectUserId;
}

/** Strips the hourly rate from a user record unless the viewer is allowed to see it. */
export function serializeUserForViewer(user: User, viewer: Pick<User, "id" | "role">): User {
  if (canSeeRate(viewer, user.id)) return user;
  return { ...user, hourlyRatePence: null };
}
