import {
  requireVerifiedSession,
  type SessionVerifier,
} from "../authentication/session";
import type { AdminAccess } from "../domain/access";
import type { AdminAction } from "../domain/permissions";
import type { AccessRepository } from "../persistence/access-repository";
import { requirePermission } from "./service";

export async function requireRequestPermission(
  repository: AccessRepository,
  verifier: SessionVerifier<Request>,
  request: Request,
  action: AdminAction,
): Promise<AdminAccess> {
  const identity = await requireVerifiedSession(verifier, request);
  return requirePermission(repository, identity, action);
}
