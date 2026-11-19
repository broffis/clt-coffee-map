import { describe, expect, it } from "vitest";
import type { ShopCandidate } from "../src/domain/candidates";
import { validateCandidate } from "../src/domain/candidates";
import { createInMemoryCandidateRepository } from "../src/persistence/candidate-memory";
import { createMongoCandidateRepository } from "../src/persistence/candidate-mongo";
import { PersistenceError } from "../src/persistence/errors";
import { createFakeDatabase } from "./fake-mongo";

const candidate: ShopCandidate = {
  id: "candidate-1",
  source: "overture",
  sourceRecordId: "ov-1",
  release: "release-1",
  name: "Bean There",
  type: "cafe",
  address: null,
  coordinates: null,
  website: null,
  importedAt: "2026-11-19T20:00:00.000Z",
  status: "pending",
  reviewedBy: null,
  reviewedAt: null,
};

async function failure(promise: Promise<unknown>): Promise<PersistenceError> {
  const error = await promise.catch((value: unknown) => value);
  expect(error).toBeInstanceOf(PersistenceError);
  return error as PersistenceError;
}

describe.each([
  ["memory", createInMemoryCandidateRepository],
  ["Mongo", () => createMongoCandidateRepository(createFakeDatabase())],
])("%s candidate repository", (_name, create) => {
  it("round-trips pending candidates and lists them by ID", async () => {
    const repository = create();
    await repository.save({ ...candidate, id: "candidate-b" });
    await repository.save({ ...candidate, id: "candidate-a" });
    await repository.save({
      ...candidate,
      id: "candidate-reviewed",
      status: "reviewed",
      reviewedBy: "user_owner",
      reviewedAt: candidate.importedAt,
    });

    expect(await repository.get("candidate-a")).toEqual({
      ...candidate,
      id: "candidate-a",
    });
    expect((await repository.listPending()).map(({ id }) => id)).toEqual([
      "candidate-a",
      "candidate-b",
    ]);
  });

  it("rejects invalid IDs", async () => {
    const repository = create();
    expect((await failure(repository.get(" "))).code).toBe("validation");
  });
});

describe("candidate validation", () => {
  it.each([
    ["blank source record", { sourceRecordId: "" }],
    ["blank release", { release: "" }],
    ["blank name", { name: "" }],
    ["invalid website", { website: "http://example.test" }],
    ["invalid coordinates", { coordinates: { latitude: 91, longitude: 0 } }],
    [
      "invalid pending review state",
      { reviewedBy: "user", reviewedAt: candidate.importedAt },
    ],
    [
      "invalid completed review state",
      { status: "reviewed", reviewedBy: null, reviewedAt: null },
    ],
  ])("rejects %s", (_label, changes) => {
    expect(() =>
      validateCandidate({ ...candidate, ...changes } as ShopCandidate),
    ).toThrow(RangeError);
  });
});

describe("Mongo candidate repository", () => {
  it("stores candidates in a private collection", async () => {
    const database = createFakeDatabase();
    await createMongoCandidateRepository(database).save(candidate);

    expect(database.collections.get("shopCandidates")?.documents).toEqual([
      expect.objectContaining({
        _id: "candidate-1",
        source: "overture",
        sourceRecordId: "ov-1",
      }),
    ]);
  });

  it("rejects invalid stored candidates and maps driver failures", async () => {
    const database = createFakeDatabase();
    const repository = createMongoCandidateRepository(database);
    await repository.save(candidate);
    const document = database.collections.get("shopCandidates")?.documents[0];
    if (document === undefined) {
      throw new Error("Expected a candidate document.");
    }
    document.name = "";
    expect((await failure(repository.get(candidate.id))).code).toBe(
      "validation",
    );

    for (const collection of database.collections.values()) {
      collection.failWith = new Error("mongodb://user:secret@host");
    }
    const error = await failure(repository.listPending());
    expect(error.code).toBe("unavailable");
    expect(error.message).not.toContain("secret");
  });
});
