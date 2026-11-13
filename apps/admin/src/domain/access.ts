import { validateIdentifier } from "./identifiers";

export type AdminRole = "owner" | "editor";
export type AccessStatus = "approved" | "revoked" | "blocked";

// A missing record means no access; only an approved record grants it.
export interface AdminAccess {
  readonly userId: string;
  readonly role: AdminRole;
  readonly status: AccessStatus;
  readonly updatedAt: string;
}

export function hasActiveAccess(access: AdminAccess | null): boolean {
  return access?.status === "approved";
}

function checkUser(access: AdminAccess | null, userId: string): void {
  validateIdentifier(userId, "User ID");
  if (access !== null && access.userId !== userId) {
    throw new Error("Access record belongs to a different user.");
  }
}

function withStatus(
  access: AdminAccess,
  status: AccessStatus,
  now: Date,
): AdminAccess {
  return { ...access, status, updatedAt: now.toISOString() };
}

// Only the trusted owner bootstrap creates owners; approvals create editors.
export function createOwnerAccess(userId: string, now: Date): AdminAccess {
  validateIdentifier(userId, "User ID");
  return {
    userId,
    role: "owner",
    status: "approved",
    updatedAt: now.toISOString(),
  };
}

export function approveAccess(
  access: AdminAccess | null,
  userId: string,
  now: Date,
): AdminAccess {
  checkUser(access, userId);
  if (access === null) {
    return {
      userId,
      role: "editor",
      status: "approved",
      updatedAt: now.toISOString(),
    };
  }
  if (access.status === "approved") {
    return access;
  }
  throw new Error("Revoked or blocked users must be restored, not approved.");
}

export function revokeAccess(
  access: AdminAccess | null,
  now: Date,
): AdminAccess {
  if (access?.status !== "approved") {
    throw new Error("Only approved users can be revoked.");
  }
  return withStatus(access, "revoked", now);
}

export function blockAccess(
  access: AdminAccess | null,
  userId: string,
  now: Date,
): AdminAccess {
  checkUser(access, userId);
  if (access === null) {
    return {
      userId,
      role: "editor",
      status: "blocked",
      updatedAt: now.toISOString(),
    };
  }
  return access.status === "blocked"
    ? access
    : withStatus(access, "blocked", now);
}

export function restoreAccess(
  access: AdminAccess | null,
  now: Date,
): AdminAccess {
  if (access === null || access.status === "approved") {
    throw new Error("Only revoked or blocked users can be restored.");
  }
  return withStatus(access, "approved", now);
}
