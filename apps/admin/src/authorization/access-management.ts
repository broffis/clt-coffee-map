import {
  approveAccess,
  blockAccess,
  type AdminAccess,
  type AccessAuditAction,
  createOwnerAccess,
  restoreAccess,
  revokeAccess,
} from "../domain/access";
import type { AccessAuditRepository } from "../persistence/access-audit-repository";
import type { AccessRepository } from "../persistence/access-repository";

export type AccessManagementErrorCode =
  | "forbidden"
  | "owner-exists"
  | "last-owner"
  | "conflict"
  | "persistence";

export class AccessManagementError extends Error {
  readonly code: AccessManagementErrorCode;

  constructor(code: AccessManagementErrorCode, message: string) {
    super(message);
    this.name = "AccessManagementError";
    this.code = code;
  }
}

interface AccessManagementDependencies {
  readonly access: AccessRepository;
  readonly audit: AccessAuditRepository;
  readonly now: () => Date;
}

function isOwner(access: AdminAccess | null): boolean {
  return access?.role === "owner" && access.status === "approved";
}

function isSameAccess(left: AdminAccess, right: AdminAccess | null): boolean {
  return (
    right !== null &&
    left.userId === right.userId &&
    left.role === right.role &&
    left.status === right.status &&
    left.updatedAt === right.updatedAt
  );
}

export function createAccessManagementService({
  access,
  audit,
  now,
}: AccessManagementDependencies) {
  let queue = Promise.resolve();

  function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function readAccess(userId: string): Promise<AdminAccess | null> {
    try {
      return await access.get(userId);
    } catch {
      throw new AccessManagementError(
        "persistence",
        "Access records could not be read.",
      );
    }
  }

  async function readAllAccess(): Promise<readonly AdminAccess[]> {
    try {
      return await access.list();
    } catch {
      throw new AccessManagementError(
        "persistence",
        "Access records could not be read.",
      );
    }
  }

  async function requireOwner(actorUserId: string): Promise<void> {
    if (!isOwner(await readAccess(actorUserId))) {
      throw new AccessManagementError(
        "forbidden",
        "Only an approved owner may manage access.",
      );
    }
  }

  async function appendAudit(
    actorUserId: string,
    targetUserId: string,
    action: AccessAuditAction,
    occurredAt: string,
  ): Promise<void> {
    try {
      await audit.append({ actorUserId, targetUserId, action, occurredAt });
    } catch {
      throw new AccessManagementError(
        "persistence",
        "Access change could not be audited.",
      );
    }
  }

  async function saveChange(
    current: AdminAccess | null,
    next: AdminAccess,
    actorUserId: string,
    action: AccessAuditAction,
  ): Promise<AdminAccess> {
    if (isSameAccess(next, current)) {
      return next;
    }
    await appendAudit(actorUserId, next.userId, action, next.updatedAt);
    try {
      if (!(await access.saveIfCurrent(next, current?.updatedAt ?? null))) {
        throw new AccessManagementError(
          "conflict",
          "The access record changed; retry the operation.",
        );
      }
    } catch (error) {
      if (error instanceof AccessManagementError) {
        throw error;
      }
      throw new AccessManagementError(
        "persistence",
        "Access record could not be saved.",
      );
    }
    return next;
  }

  async function change(
    actorUserId: string,
    targetUserId: string,
    action: Exclude<AccessAuditAction, "bootstrap-owner">,
  ): Promise<AdminAccess> {
    await requireOwner(actorUserId);
    const current = await readAccess(targetUserId);
    const timestamp = now();

    if ((action === "revoke" || action === "block") && isOwner(current)) {
      const approvedOwners = (await readAllAccess()).filter(isOwner);
      if (approvedOwners.length <= 1) {
        throw new AccessManagementError(
          "last-owner",
          "The last approved owner cannot lose access.",
        );
      }
    }

    const next =
      action === "approve"
        ? approveAccess(current, targetUserId, timestamp)
        : action === "block"
          ? blockAccess(current, targetUserId, timestamp)
          : action === "restore"
            ? restoreAccess(current, timestamp)
            : revokeAccess(current, timestamp);

    return saveChange(current, next, actorUserId, action);
  }

  return {
    bootstrapOwner(userId: string): Promise<AdminAccess> {
      return runExclusive(async () => {
        const records = await readAllAccess();
        if (records.some(({ role }) => role === "owner")) {
          throw new AccessManagementError(
            "owner-exists",
            "An owner is already configured.",
          );
        }
        const owner = createOwnerAccess(userId, now());
        return saveChange(null, owner, userId, "bootstrap-owner");
      });
    },
    approve(actorUserId: string, targetUserId: string) {
      return runExclusive(() => change(actorUserId, targetUserId, "approve"));
    },
    revoke(actorUserId: string, targetUserId: string) {
      return runExclusive(() => change(actorUserId, targetUserId, "revoke"));
    },
    block(actorUserId: string, targetUserId: string) {
      return runExclusive(() => change(actorUserId, targetUserId, "block"));
    },
    restore(actorUserId: string, targetUserId: string) {
      return runExclusive(() => change(actorUserId, targetUserId, "restore"));
    },
  };
}
