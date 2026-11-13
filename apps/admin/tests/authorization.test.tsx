import { describe, expect, it } from "vitest";
import {
  approveAccess,
  blockAccess,
  createOwnerAccess,
  revokeAccess,
} from "../src/domain/access";
import {
  AuthorizationError,
  authorize,
  requirePermission,
} from "../src/authorization/service";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import type { AccessRepository } from "../src/persistence/access-repository";
import { PersistenceError } from "../src/persistence/errors";

const NOW = new Date("2026-11-13T12:00:00.000Z");

async function repositoryWith(
  ...records: Parameters<AccessRepository["save"]>[0][]
): Promise<AccessRepository> {
  const repository = createInMemoryAccessRepository();
  for (const record of records) {
    await repository.save(record);
  }
  return repository;
}

describe("authorize", () => {
  it("allows an approved editor and returns the current record", async () => {
    const approved = approveAccess(null, "user_1", NOW);
    const repository = await repositoryWith(approved);

    expect(
      await authorize(repository, { userId: "user_1" }, "shop:edit"),
    ).toEqual({
      allowed: true,
      access: approved,
    });
  });

  it("denies a user with no record", async () => {
    const result = await authorize(
      await repositoryWith(),
      { userId: "user_unknown" },
      "private:read",
    );

    expect(result).toEqual({ allowed: false, reason: "no-access" });
  });

  it("explains revoked and blocked denials", async () => {
    const approved = approveAccess(null, "user_1", NOW);
    const revoked = await repositoryWith(revokeAccess(approved, NOW));
    const blocked = await repositoryWith(blockAccess(approved, "user_1", NOW));
    const identity = { userId: "user_1" };

    expect(await authorize(revoked, identity, "shop:edit")).toEqual({
      allowed: false,
      reason: "revoked",
    });
    expect(await authorize(blocked, identity, "shop:edit")).toEqual({
      allowed: false,
      reason: "blocked",
    });
  });

  it("denies editors access management but allows owners", async () => {
    const repository = await repositoryWith(
      approveAccess(null, "user_editor", NOW),
      createOwnerAccess("user_owner", NOW),
    );

    expect(
      await authorize(repository, { userId: "user_editor" }, "access:manage"),
    ).toEqual({ allowed: false, reason: "forbidden" });
    expect(
      (await authorize(repository, { userId: "user_owner" }, "access:manage"))
        .allowed,
    ).toBe(true);
  });

  it("applies revocation to the next call for an existing session", async () => {
    const approved = approveAccess(null, "user_1", NOW);
    const repository = await repositoryWith(approved);
    const session = { userId: "user_1" };
    expect((await authorize(repository, session, "shop:edit")).allowed).toBe(
      true,
    );

    await repository.save(revokeAccess(approved, NOW));

    expect((await authorize(repository, session, "shop:edit")).allowed).toBe(
      false,
    );
    expect((await authorize(repository, session, "private:read")).allowed).toBe(
      false,
    );
  });

  it("applies blocking and restoring on the next call", async () => {
    const approved = approveAccess(null, "user_1", NOW);
    const repository = await repositoryWith(approved);
    const session = { userId: "user_1" };

    await repository.save(blockAccess(approved, "user_1", NOW));
    expect((await authorize(repository, session, "photo:upload")).allowed).toBe(
      false,
    );
  });

  it("denies when the store cannot be read", async () => {
    const failing: AccessRepository = {
      get: async () => {
        throw new PersistenceError("unavailable", "Database operation failed.");
      },
      list: async () => [],
      save: async () => undefined,
    };

    expect(await authorize(failing, { userId: "user_1" }, "shop:edit")).toEqual(
      {
        allowed: false,
        reason: "unverifiable",
      },
    );
  });

  it("denies a blank user ID without failing open", async () => {
    expect(
      await authorize(await repositoryWith(), { userId: " " }, "shop:edit"),
    ).toEqual({ allowed: false, reason: "unverifiable" });
  });
});

describe("requirePermission", () => {
  it("returns the access record when allowed", async () => {
    const owner = createOwnerAccess("user_owner", NOW);
    const repository = await repositoryWith(owner);

    expect(
      await requirePermission(
        repository,
        { userId: "user_owner" },
        "shop:publish",
      ),
    ).toEqual(owner);
  });

  it("throws an explicit error with the reason when denied", async () => {
    const repository = await repositoryWith();

    const error = await requirePermission(
      repository,
      { userId: "user_unknown" },
      "shop:edit",
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AuthorizationError);
    expect((error as AuthorizationError).reason).toBe("no-access");
    expect((error as AuthorizationError).message).toBe(
      "Not authorized to perform this action.",
    );
  });
});
