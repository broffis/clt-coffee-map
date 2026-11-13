import type { AdminAccess } from "../domain/access";
import { type AdminAction, can } from "../domain/permissions";
import type { AccessRepository } from "../persistence/access-repository";

// The user ID must come from a verified server-side session, never the client.
export interface VerifiedIdentity {
  readonly userId: string;
}

export type DenialReason =
  | "no-access"
  | "revoked"
  | "blocked"
  | "forbidden"
  | "unverifiable";

export type AuthorizationResult =
  | { readonly allowed: true; readonly access: AdminAccess }
  | { readonly allowed: false; readonly reason: DenialReason };

export class AuthorizationError extends Error {
  readonly reason: DenialReason;

  constructor(reason: DenialReason) {
    super("Not authorized to perform this action.");
    this.name = "AuthorizationError";
    this.reason = reason;
  }
}

function denialFor(access: AdminAccess | null): DenialReason {
  if (access === null) {
    return "no-access";
  }
  if (access.status === "revoked") {
    return "revoked";
  }
  return access.status === "blocked" ? "blocked" : "forbidden";
}

// Reads the current record on every call; nothing is cached or trusted from
// session claims, so revocation applies to existing sessions immediately.
export async function authorize(
  repository: AccessRepository,
  identity: VerifiedIdentity,
  action: AdminAction,
): Promise<AuthorizationResult> {
  if (identity.userId.trim() === "") {
    return { allowed: false, reason: "unverifiable" };
  }
  let access: AdminAccess | null;
  try {
    access = await repository.get(identity.userId);
  } catch {
    return { allowed: false, reason: "unverifiable" };
  }
  if (access !== null && can(access, action)) {
    return { allowed: true, access };
  }
  return { allowed: false, reason: denialFor(access) };
}

export async function requirePermission(
  repository: AccessRepository,
  identity: VerifiedIdentity,
  action: AdminAction,
): Promise<AdminAccess> {
  const result = await authorize(repository, identity, action);
  if (!result.allowed) {
    throw new AuthorizationError(result.reason);
  }
  return result.access;
}
