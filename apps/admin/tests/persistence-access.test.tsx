import { describe, expect, it } from "vitest";
import { type AdminAccess, hasActiveAccess } from "../src/domain/access";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createMongoAccessRepository } from "../src/persistence/access-mongo";
import { PersistenceError } from "../src/persistence/errors";
import { createFakeDatabase } from "./fake-mongo";

function access(userId: string, status: AdminAccess["status"]): AdminAccess {
  return {
    userId,
    role: "editor",
    status,
    updatedAt: "2026-11-13T12:00:00.000Z",
  };
}

async function failure(promise: Promise<unknown>): Promise<PersistenceError> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(PersistenceError);
  return error as PersistenceError;
}

describe.each([
  ["in-memory", createInMemoryAccessRepository],
  [
    "Mongo (fake database)",
    () => createMongoAccessRepository(createFakeDatabase()),
  ],
])("%s access repository", (_name, create) => {
  it("returns null for unknown users", async () => {
    expect(await create().get("user_unknown")).toBeNull();
  });

  it("round-trips records as isolated copies", async () => {
    const repository = create();
    const original = access("user_1", "approved");
    await repository.save(original);

    const stored = await repository.get("user_1");
    expect(stored).toEqual(original);
    expect(stored).not.toBe(original);
  });

  it("replaces a record on save so status changes persist", async () => {
    const repository = create();
    await repository.save(access("user_1", "approved"));
    await repository.save(access("user_1", "revoked"));

    expect((await repository.get("user_1"))?.status).toBe("revoked");
    expect(await repository.list()).toHaveLength(1);
  });

  it("lists records in user ID order", async () => {
    const repository = create();
    await repository.save(access("user_b", "approved"));
    await repository.save(access("user_a", "blocked"));

    expect((await repository.list()).map(({ userId }) => userId)).toEqual([
      "user_a",
      "user_b",
    ]);
  });

  it("starts a recreated account with a new user ID unapproved", async () => {
    const repository = create();
    await repository.save(access("user_old", "blocked"));
    await repository.save(access("user_other", "approved"));

    const recreated = await repository.get("user_new");

    expect(recreated).toBeNull();
    expect(hasActiveAccess(recreated)).toBe(false);
    expect(hasActiveAccess(await repository.get("user_old"))).toBe(false);
  });

  it("rejects blank user IDs", async () => {
    const repository = create();

    expect((await failure(repository.get(" "))).code).toBe("validation");
    expect((await failure(repository.save(access("", "approved")))).code).toBe(
      "validation",
    );
  });
});

describe("Mongo access repository", () => {
  it("stores the user ID as _id", async () => {
    const database = createFakeDatabase();
    await createMongoAccessRepository(database).save(
      access("user_1", "approved"),
    );

    expect(database.collections.get("adminAccess")?.documents).toEqual([
      {
        _id: "user_1",
        role: "editor",
        status: "approved",
        updatedAt: "2026-11-13T12:00:00.000Z",
      },
    ]);
  });

  it("refuses to read a stored record with an unknown status or role", async () => {
    const database = createFakeDatabase();
    const repository = createMongoAccessRepository(database);
    await repository.save(access("user_1", "approved"));
    const document = database.collections.get("adminAccess")?.documents[0];
    if (document === undefined) {
      throw new Error("Expected a stored record.");
    }

    document.status = "superuser";
    expect((await failure(repository.get("user_1"))).code).toBe("validation");
    document.status = "approved";
    document.role = "admin";
    expect((await failure(repository.list())).code).toBe("validation");
  });

  it("maps driver failures to a generic unavailable error", async () => {
    const database = createFakeDatabase();
    const repository = createMongoAccessRepository(database);
    await repository.save(access("user_1", "approved"));
    for (const collection of database.collections.values()) {
      collection.failWith = new Error("mongodb://user:secret@host");
    }

    for (const operation of [
      repository.get("user_1"),
      repository.list(),
      repository.save(access("user_1", "revoked")),
    ]) {
      const error = await failure(operation);
      expect(error.code).toBe("unavailable");
      expect(error.message).not.toContain("secret");
    }
  });
});
