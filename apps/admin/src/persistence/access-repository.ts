import type { AdminAccess } from "../domain/access";

// Authorization state is private; keep it separate from shop repositories.
export interface AccessRepository {
  get(userId: string): Promise<AdminAccess | null>;
  list(): Promise<readonly AdminAccess[]>;
  // Records are never deleted so revoked and blocked users stay denied.
  save(access: AdminAccess): Promise<void>;
}
