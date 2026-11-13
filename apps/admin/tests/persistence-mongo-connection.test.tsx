import { describe, expect, it, vi } from "vitest";
import { PersistenceError } from "../src/persistence/errors";
import { readMongoConfig } from "../src/persistence/mongo-config";
import {
  createMongoClient,
  createMongoConnection,
} from "../src/persistence/mongo-connection";

const config = {
  uri: "mongodb+srv://user:secret@example.mongodb.net",
  databaseName: "clt",
};

function fakeClient() {
  return {
    connect: vi.fn(async () => undefined),
    db: vi.fn((name: string) => ({ name })),
    close: vi.fn(async () => undefined),
  };
}

describe("Mongo configuration", () => {
  it("reads the URI and database name from the environment", () => {
    expect(
      readMongoConfig({
        MONGODB_URI: " mongodb://localhost:27017 ",
        MONGODB_DB_NAME: " clt ",
      }),
    ).toEqual({ uri: "mongodb://localhost:27017", databaseName: "clt" });
  });

  it.each([
    [{ MONGODB_DB_NAME: "clt" }, "MONGODB_URI"],
    [
      { MONGODB_URI: "mongodb://localhost", MONGODB_DB_NAME: " " },
      "MONGODB_DB_NAME",
    ],
  ])("fails clearly when a setting is missing", (env, name) => {
    expect(() => readMongoConfig(env)).toThrow(PersistenceError);
    expect(() => readMongoConfig(env)).toThrow(name);
  });

  it("rejects non-MongoDB URIs without echoing the value", () => {
    const env = {
      MONGODB_URI: "https://secret@example.com",
      MONGODB_DB_NAME: "clt",
    };

    expect(() => readMongoConfig(env)).toThrow(/mongodb/);
    expect(() => readMongoConfig(env)).not.toThrow(/secret/);
  });
});

describe("Mongo connection", () => {
  it("connects lazily and reuses one client", async () => {
    const client = fakeClient();
    const create = vi.fn(() => client);
    const connection = createMongoConnection(config, create);
    expect(create).not.toHaveBeenCalled();

    const [first, second] = await Promise.all([
      connection.getDatabase(),
      connection.getDatabase(),
    ]);
    await connection.getDatabase();

    expect(first).toBe(second);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(config.uri);
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.db).toHaveBeenCalledWith("clt");
  });

  it("retries after a failed connection without leaking the URI", async () => {
    const failing = fakeClient();
    failing.connect.mockRejectedValueOnce(new Error("bad secret"));
    const working = fakeClient();
    const create = vi
      .fn()
      .mockReturnValueOnce(failing)
      .mockReturnValueOnce(working);
    const connection = createMongoConnection(config, create);

    const error = await connection.getDatabase().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PersistenceError);
    expect((error as PersistenceError).code).toBe("unavailable");
    expect((error as PersistenceError).message).not.toContain("secret");
    expect(failing.close).toHaveBeenCalled();

    await connection.getDatabase();
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("closes the client and reconnects on the next use", async () => {
    const first = fakeClient();
    const second = fakeClient();
    const create = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const connection = createMongoConnection(config, create);

    await connection.close();
    expect(create).not.toHaveBeenCalled();

    await connection.getDatabase();
    await connection.close();
    expect(first.close).toHaveBeenCalledTimes(1);

    await connection.getDatabase();
    expect(second.connect).toHaveBeenCalledTimes(1);
  });

  it("creates a real driver client without connecting", () => {
    const client = createMongoClient("mongodb://127.0.0.1:1");

    expect(typeof client.connect).toBe("function");
  });
});
