import { describe, expect, it } from "vitest";
import { createInMemoryAccessAuditRepository } from "../src/persistence/access-audit-memory";
import type { AccessAuditRecord } from "../src/domain/access";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import {
  AccessManagementError,
  createAccessManagementService,
} from "../src/authorization/access-management";
import { createOwnerAccess } from "../src/domain/access";

const T1 = new Date("2026-11-17T12:00:00.000Z");
const T2 = new Date("2026-11-17T12:01:00.000Z");

function createService() {
  const access = createInMemoryAccessRepository();
  const audit = createInMemoryAccessAuditRepository();
  const service = createAccessManagementService({
    access,
    audit,
    now: () => T1,
  });
  return { access, audit, service };
}

describe("access management", () => {
  it("bootstraps one trusted owner and audits the bootstrap", async () => {
    const { access, audit, service } = createService();

    await expect(service.bootstrapOwner("user_owner")).resolves.toEqual(
      createOwnerAccess("user_owner", T1),
    );
    await expect(service.bootstrapOwner("user_other")).rejects.toMatchObject({
      code: "owner-exists",
    });
    await expect(access.get("user_owner")).resolves.toEqual(
      createOwnerAccess("user_owner", T1),
    );
    await expect(audit.list()).resolves.toEqual([
      {
        actorUserId: "user_owner",
        targetUserId: "user_owner",
        action: "bootstrap-owner",
        occurredAt: T1.toISOString(),
      },
    ]);
  });

  it("requires the current owner for every access change", async () => {
    const { service } = createService();

    await service.bootstrapOwner("user_owner");

    await expect(
      service.approve("user_editor", "user_target"),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      service.approve("user_owner", "user_target"),
    ).resolves.toMatchObject({ role: "editor", status: "approved" });
  });

  it("audits approval, blocking, restoring, and revocation", async () => {
    const { audit, service } = createService();
    await service.bootstrapOwner("user_owner");

    await service.approve("user_owner", "user_editor");
    await service.block("user_owner", "user_editor");
    await service.restore("user_owner", "user_editor");
    await service.revoke("user_owner", "user_editor");

    expect(await audit.list()).toEqual([
      {
        actorUserId: "user_owner",
        targetUserId: "user_owner",
        action: "bootstrap-owner",
        occurredAt: T1.toISOString(),
      },
      {
        actorUserId: "user_owner",
        targetUserId: "user_editor",
        action: "approve",
        occurredAt: T1.toISOString(),
      },
      {
        actorUserId: "user_owner",
        targetUserId: "user_editor",
        action: "block",
        occurredAt: T1.toISOString(),
      },
      {
        actorUserId: "user_owner",
        targetUserId: "user_editor",
        action: "restore",
        occurredAt: T1.toISOString(),
      },
      {
        actorUserId: "user_owner",
        targetUserId: "user_editor",
        action: "revoke",
        occurredAt: T1.toISOString(),
      },
    ]);
  });

  it("prevents removing the last approved owner", async () => {
    const { access, service } = createService();
    await access.save(createOwnerAccess("user_owner", T1));

    await expect(service.revoke("user_owner", "user_owner")).rejects.toEqual(
      new AccessManagementError(
        "last-owner",
        "The last approved owner cannot lose access.",
      ),
    );
    await expect(
      service.block("user_owner", "user_owner"),
    ).rejects.toMatchObject({ code: "last-owner" });
  });

  it("allows owner access changes when another approved owner remains", async () => {
    const { access, service } = createService();
    await access.save(createOwnerAccess("user_owner", T1));
    await access.save(createOwnerAccess("user_other", T1));

    await expect(
      service.revoke("user_owner", "user_owner"),
    ).resolves.toMatchObject({ status: "revoked" });
  });

  it("does not overwrite a concurrent update", async () => {
    const { access, service } = createService();
    await access.save(createOwnerAccess("user_owner", T1));
    await service.approve("user_owner", "user_editor");

    const first = access.get("user_editor");
    const second = access.get("user_editor");
    const [firstRecord, secondRecord] = await Promise.all([first, second]);
    if (firstRecord === null || secondRecord === null) {
      throw new Error("Expected an access record.");
    }

    await access.saveIfCurrent(
      { ...firstRecord, status: "blocked", updatedAt: T2.toISOString() },
      firstRecord.updatedAt,
    );
    await expect(
      access.saveIfCurrent(
        { ...secondRecord, status: "revoked", updatedAt: T2.toISOString() },
        secondRecord.updatedAt,
      ),
    ).resolves.toBe(false);
  });

  it("surfaces audit persistence failures", async () => {
    const access = createInMemoryAccessRepository();
    const audit = createInMemoryAccessAuditRepository();
    const failingAudit = {
      append: async (_record: AccessAuditRecord) => {
        throw new Error("audit unavailable");
      },
      list: audit.list,
    };
    const service = createAccessManagementService({
      access,
      audit: failingAudit,
      now: () => T1,
    });

    await expect(service.bootstrapOwner("user_owner")).rejects.toMatchObject({
      code: "persistence",
    });
  });
});
