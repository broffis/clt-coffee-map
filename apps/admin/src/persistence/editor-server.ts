import "@tanstack/react-start/server-only";
import { readMongoWriteConfig } from "./mongo-config";
import {
  createMongoClient,
  createMongoConnection,
  type MongoConnection,
} from "./mongo-connection";
import {
  createMongoRepositories,
  type MongoDatabase,
} from "./mongo-repositories";
import type { Repositories } from "./repositories";

let connection: MongoConnection<MongoDatabase> | undefined;

// Resolved per call so missing credentials surface as a persistence error
// from the handler instead of failing at import time.
export const serverEditorRepositories: Pick<
  Repositories,
  "shops" | "locations"
> = {
  shops: {
    async get(id) {
      return (await repositories()).shops.get(id);
    },
    async list() {
      return (await repositories()).shops.list();
    },
    async save(shop) {
      return (await repositories()).shops.save(shop);
    },
    async delete(id) {
      return (await repositories()).shops.delete(id);
    },
  },
  locations: {
    async get(id) {
      return (await repositories()).locations.get(id);
    },
    async listByShop(shopId) {
      return (await repositories()).locations.listByShop(shopId);
    },
    async save(location) {
      return (await repositories()).locations.save(location);
    },
    async delete(id) {
      return (await repositories()).locations.delete(id);
    },
  },
};

async function repositories(): Promise<Repositories> {
  connection ??= createMongoConnection(
    readMongoWriteConfig(process.env),
    createMongoClient,
  );
  return createMongoRepositories(await connection.getDatabase());
}
