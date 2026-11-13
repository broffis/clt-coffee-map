import { MongoClient } from "mongodb";
import { PersistenceError } from "./errors";
import type { MongoConfig } from "./mongo-config";

export interface DatabaseClient<TDatabase> {
  connect(): Promise<unknown>;
  db(name: string): TDatabase;
  close(): Promise<void>;
}

export interface MongoConnection<TDatabase> {
  getDatabase(): Promise<TDatabase>;
  close(): Promise<void>;
}

export function createMongoClient(uri: string): MongoClient {
  return new MongoClient(uri);
}

// Connects lazily and shares one client so serverless invocations reuse it.
export function createMongoConnection<TDatabase>(
  config: MongoConfig,
  createClient: (uri: string) => DatabaseClient<TDatabase>,
): MongoConnection<TDatabase> {
  let pending: {
    client: DatabaseClient<TDatabase>;
    database: Promise<TDatabase>;
  } | null = null;

  return {
    getDatabase() {
      if (pending === null) {
        const client = createClient(config.uri);
        const database = client.connect().then(
          () => client.db(config.databaseName),
          async () => {
            pending = null;
            await client.close().catch(() => undefined);
            // The driver's message can include the connection string.
            throw new PersistenceError(
              "unavailable",
              "Could not connect to the database.",
            );
          },
        );
        pending = { client, database };
      }
      return pending.database;
    },
    async close() {
      const current = pending;
      pending = null;
      await current?.client.close();
    },
  };
}
