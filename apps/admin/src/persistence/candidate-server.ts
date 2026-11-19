import "@tanstack/react-start/server-only";
import type { ShopCandidate } from "../domain/candidates";
import { createMongoCandidateRepository } from "./candidate-mongo";
import { readMongoWriteConfig } from "./mongo-config";
import {
  createMongoClient,
  createMongoConnection,
  type MongoConnection,
} from "./mongo-connection";
import type { MongoDatabase } from "./mongo-repositories";

let connection: MongoConnection<MongoDatabase> | undefined;

async function repository() {
  connection ??= createMongoConnection(
    readMongoWriteConfig(process.env),
    createMongoClient,
  );
  return createMongoCandidateRepository(await connection.getDatabase());
}

export const serverCandidateRepository = {
  async get(id: string): Promise<ShopCandidate | null> {
    return (await repository()).get(id);
  },
  async listPending(): Promise<readonly ShopCandidate[]> {
    return (await repository()).listPending();
  },
  async save(candidate: ShopCandidate): Promise<void> {
    await (await repository()).save(candidate);
  },
};
