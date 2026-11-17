import "@tanstack/react-start/server-only";
import type { AdminAccess } from "../domain/access";
import { createMongoAccessRepository } from "./access-mongo";
import { readMongoConfig } from "./mongo-config";
import {
  createMongoClient,
  createMongoConnection,
  type MongoConnection,
} from "./mongo-connection";
import type { MongoDatabase } from "./mongo-repositories";

let connection: MongoConnection<MongoDatabase> | undefined;

export const serverAccessReader = {
  async get(userId: string): Promise<AdminAccess | null> {
    connection ??= createMongoConnection(
      readMongoConfig(process.env),
      createMongoClient,
    );
    const database = await connection.getDatabase();
    return createMongoAccessRepository(database).get(userId);
  },
};
