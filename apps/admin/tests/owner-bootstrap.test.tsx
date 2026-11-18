import { MongoClient } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bootstrapInitialOwner,
  readOwnerBootstrapConfig,
} from "../src/authorization/owner-bootstrap";

const mongo = vi.hoisted(() => {
  const access = { findOne: vi.fn(), insertOne: vi.fn() };
  const audit = { findOne: vi.fn(), insertOne: vi.fn() };
  const session = { marker: "bootstrap-session" };
  const withTransaction = vi.fn(async (operation: () => Promise<void>) =>
    operation(),
  );
  const withSession = vi.fn(
    async (
      operation: (
        context: typeof session & { withTransaction: typeof withTransaction },
      ) => Promise<void>,
    ) => operation({ ...session, withTransaction }),
  );
  const collection = vi.fn((name: string) =>
    name === "adminAccess" ? access : audit,
  );
  return {
    access,
    audit,
    session,
    withSession,
    withTransaction,
    collection,
    db: vi.fn(() => ({ collection })),
  };
});

vi.mock("mongodb", () => ({
  MongoClient: class {
    db = mongo.db;
    withSession = mongo.withSession;
  },
}));

const config = {
  uri: "mongodb://localhost:27017",
  databaseName: "bootstrap_test",
  userId: "user_owner",
};
const now = new Date("2026-11-17T22:15:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  mongo.access.findOne.mockReset().mockResolvedValue(null);
  mongo.audit.findOne.mockReset().mockResolvedValue(null);
  mongo.access.insertOne.mockReset().mockResolvedValue({});
  mongo.audit.insertOne.mockReset().mockResolvedValue({});
});

describe("trusted initial owner bootstrap", () => {
  it("defaults to read-only preflight", async () => {
    await bootstrapInitialOwner(new MongoClient(config.uri), config, { now });

    expect(mongo.db).toHaveBeenCalledWith(config.databaseName);
    expect(mongo.access.insertOne).not.toHaveBeenCalled();
    expect(mongo.audit.insertOne).not.toHaveBeenCalled();
  });

  it("writes the owner and singleton audit entry in the same transaction", async () => {
    await bootstrapInitialOwner(new MongoClient(config.uri), config, {
      apply: true,
      now,
    });

    const session = expect.objectContaining(mongo.session);
    expect(mongo.withTransaction).toHaveBeenCalledWith(expect.any(Function), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      maxCommitTimeMS: 5000,
    });
    expect(mongo.audit.insertOne).toHaveBeenCalledWith(
      {
        _id: "initial-owner-bootstrap",
        actorUserId: config.userId,
        targetUserId: config.userId,
        action: "bootstrap-owner",
        occurredAt: now.toISOString(),
      },
      { session },
    );
    expect(mongo.access.insertOne).toHaveBeenCalledWith(
      {
        _id: config.userId,
        role: "owner",
        status: "approved",
        updatedAt: now.toISOString(),
      },
      { session },
    );
    expect(mongo.access.findOne).toHaveBeenCalledWith(
      { role: "owner" },
      { session },
    );
    expect(mongo.access.findOne).toHaveBeenCalledWith(
      { _id: config.userId },
      { session },
    );
    expect(mongo.audit.findOne).toHaveBeenCalledWith(
      { _id: "initial-owner-bootstrap" },
      { session },
    );
  });

  it.each(["approved", "revoked", "blocked"])(
    "refuses bootstrap when an %s owner exists",
    async (status) => {
      mongo.access.findOne.mockResolvedValueOnce({
        _id: "user_existing",
        role: "owner",
        status,
      });

      await expect(
        bootstrapInitialOwner(new MongoClient(config.uri), config, {
          apply: true,
          now,
        }),
      ).rejects.toThrow("An owner record already exists.");
      expect(mongo.access.insertOne).not.toHaveBeenCalled();
      expect(mongo.audit.insertOne).not.toHaveBeenCalled();
    },
  );

  it("preserves an existing target access decision", async () => {
    mongo.access.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      _id: config.userId,
      role: "editor",
      status: "blocked",
    });

    await expect(
      bootstrapInitialOwner(new MongoClient(config.uri), config, {
        apply: true,
        now,
      }),
    ).rejects.toThrow("The target already has an access record.");
    expect(mongo.access.insertOne).not.toHaveBeenCalled();
    expect(mongo.audit.insertOne).not.toHaveBeenCalled();
  });

  it("does not reuse bootstrap after its owner record is removed", async () => {
    mongo.audit.findOne.mockResolvedValueOnce({
      _id: "initial-owner-bootstrap",
    });

    await expect(
      bootstrapInitialOwner(new MongoClient(config.uri), config, {
        apply: true,
        now,
      }),
    ).rejects.toThrow("Initial owner bootstrap was already used.");
    expect(mongo.access.insertOne).not.toHaveBeenCalled();
    expect(mongo.audit.insertOne).not.toHaveBeenCalled();
  });

  it("propagates a failed write out of the transaction without leaking driver errors", async () => {
    mongo.access.insertOne.mockRejectedValueOnce(
      new Error("credential-bearing driver error"),
    );

    await expect(
      bootstrapInitialOwner(new MongoClient(config.uri), config, {
        apply: true,
        now,
      }),
    ).rejects.toThrow(
      "Bootstrap could not be confirmed. Inspect access and audit records before retrying.",
    );
  });

  it("fails closed on a competing singleton insert", async () => {
    mongo.audit.insertOne.mockRejectedValueOnce({ code: 11000 });

    await expect(
      bootstrapInitialOwner(new MongoClient(config.uri), config, {
        apply: true,
        now,
      }),
    ).rejects.toThrow("Bootstrap could not be confirmed.");
    expect(mongo.access.insertOne).not.toHaveBeenCalled();
  });
});

describe("isolated bootstrap configuration", () => {
  it("uses only explicit bootstrap settings", () => {
    expect(
      readOwnerBootstrapConfig({
        BOOTSTRAP_MONGODB_URI: config.uri,
        BOOTSTRAP_MONGODB_DB_NAME: config.databaseName,
        BOOTSTRAP_CLERK_USER_ID: config.userId,
      }),
    ).toEqual(config);
  });

  it.each([
    {},
    { MONGODB_URI: config.uri, MONGODB_DB_NAME: config.databaseName },
    { BOOTSTRAP_MONGODB_URI: config.uri },
    {
      BOOTSTRAP_MONGODB_URI: "https://not-mongo.invalid",
      BOOTSTRAP_MONGODB_DB_NAME: config.databaseName,
      BOOTSTRAP_CLERK_USER_ID: config.userId,
    },
    {
      BOOTSTRAP_MONGODB_URI: config.uri,
      BOOTSTRAP_MONGODB_DB_NAME: config.databaseName,
      BOOTSTRAP_CLERK_USER_ID: "not-a-clerk-id",
    },
  ])(
    "rejects incomplete or invalid settings without app-credential fallback",
    (env) => {
      expect(() => readOwnerBootstrapConfig(env)).toThrow(
        "Set valid BOOTSTRAP_MONGODB_URI, BOOTSTRAP_MONGODB_DB_NAME, and BOOTSTRAP_CLERK_USER_ID.",
      );
    },
  );
});
