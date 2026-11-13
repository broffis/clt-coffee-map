import type { Document, Filter as MongoFilter } from "mongodb";
import {
  exportPublishedShop,
  type PublishedShopExport,
} from "../domain/export";
import type { ShopLocation } from "../domain/location";
import type { Shop } from "../domain/shop";
import { checkIdentifier } from "./checks";
import { PersistenceError } from "./errors";
import type { Repositories } from "./repositories";

// Narrow slice of the driver's Collection so tests can use a fake collection.
export interface DocumentCollection<T extends Document> {
  findOne(filter: MongoFilter<T>): Promise<T | null>;
  find(filter: MongoFilter<T>): { toArray(): Promise<T[]> };
  countDocuments(filter: MongoFilter<T>): Promise<number>;
  replaceOne(
    filter: MongoFilter<T>,
    replacement: Omit<T, "_id">,
    options: { upsert: true },
  ): Promise<unknown>;
  deleteOne(filter: MongoFilter<T>): Promise<{ deletedCount: number }>;
  createIndex(specification: Record<string, 1 | -1>): Promise<unknown>;
}

export interface MongoDatabase {
  collection<T extends Document>(name: string): DocumentCollection<T>;
}

type ShopDocument = {
  _id: string;
  draft: Shop["draft"];
  published: Shop["published"];
};

type LocationDocument = {
  _id: string;
  shopId: string;
  draft: ShopLocation["draft"];
  published: ShopLocation["published"];
};

const DUPLICATE_KEY = 11000;
const PUBLISHED = { published: { $ne: null } };

function toShop(document: ShopDocument): Shop {
  return {
    id: document._id,
    draft: document.draft,
    published: document.published,
  };
}

function toLocation(document: LocationDocument): ShopLocation {
  return {
    id: document._id,
    shopId: document.shopId,
    draft: document.draft,
    published: document.published,
  };
}

// Driver messages can contain connection details, so they are not propagated.
export async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }
    throw new PersistenceError("unavailable", "Database operation failed.");
  }
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY
  );
}

export async function ensureMongoIndexes(
  database: MongoDatabase,
): Promise<void> {
  await run(() =>
    database
      .collection<LocationDocument>("locations")
      .createIndex({ shopId: 1 }),
  );
}

// Reference and delete checks are separate reads, not transactions.
export function createMongoRepositories(database: MongoDatabase): Repositories {
  const shopCollection = database.collection<ShopDocument>("shops");
  const locationCollection = database.collection<LocationDocument>("locations");

  const locationsOf = async (
    filter: MongoFilter<LocationDocument>,
  ): Promise<ShopLocation[]> =>
    (await locationCollection.find(filter).toArray()).map(toLocation);

  return {
    shops: {
      get: (id) =>
        run(async () => {
          checkIdentifier(id, "Shop ID");
          const document = await shopCollection.findOne({ _id: id });
          return document === null ? null : toShop(document);
        }),
      list: () =>
        run(async () => (await shopCollection.find({}).toArray()).map(toShop)),
      save: (shop) =>
        run(async () => {
          checkIdentifier(shop.id, "Shop ID");
          await shopCollection.replaceOne(
            { _id: shop.id },
            { draft: shop.draft, published: shop.published },
            { upsert: true },
          );
        }),
      delete: (id) =>
        run(async () => {
          checkIdentifier(id, "Shop ID");
          if ((await locationCollection.countDocuments({ shopId: id })) > 0) {
            throw new PersistenceError("conflict", "Shop still has locations.");
          }
          const { deletedCount } = await shopCollection.deleteOne({ _id: id });
          if (deletedCount === 0) {
            throw new PersistenceError("not-found", "Shop does not exist.");
          }
        }),
    },
    locations: {
      get: (id) =>
        run(async () => {
          checkIdentifier(id, "Location ID");
          const document = await locationCollection.findOne({ _id: id });
          return document === null ? null : toLocation(document);
        }),
      listByShop: (shopId) =>
        run(async () => {
          checkIdentifier(shopId, "Shop ID");
          return locationsOf({ shopId });
        }),
      save: (location) =>
        run(async () => {
          checkIdentifier(location.id, "Location ID");
          checkIdentifier(location.shopId, "Shop ID");
          if (
            (await shopCollection.countDocuments({ _id: location.shopId })) ===
            0
          ) {
            throw new PersistenceError(
              "missing-reference",
              "Location's shop does not exist.",
            );
          }
          try {
            // Matching shopId makes an existing ID under another shop a duplicate key.
            await locationCollection.replaceOne(
              { _id: location.id, shopId: location.shopId },
              {
                shopId: location.shopId,
                draft: location.draft,
                published: location.published,
              },
              { upsert: true },
            );
          } catch (error) {
            if (isDuplicateKey(error)) {
              throw new PersistenceError(
                "conflict",
                "Location cannot move to another shop.",
              );
            }
            throw error;
          }
        }),
      delete: (id) =>
        run(async () => {
          checkIdentifier(id, "Location ID");
          const { deletedCount } = await locationCollection.deleteOne({
            _id: id,
          });
          if (deletedCount === 0) {
            throw new PersistenceError("not-found", "Location does not exist.");
          }
        }),
    },
    published: {
      get: (shopId) =>
        run(async () => {
          checkIdentifier(shopId, "Shop ID");
          const document = await shopCollection.findOne({ _id: shopId });
          if (document === null || document.published === null) {
            return null;
          }
          return exportPublishedShop(
            toShop(document),
            await locationsOf({ shopId, ...PUBLISHED }),
          );
        }),
      list: () =>
        run(async () => {
          const shops = (await shopCollection.find(PUBLISHED).toArray()).map(
            toShop,
          );
          const locations = await locationsOf({
            shopId: { $in: shops.map((shop) => shop.id) },
            ...PUBLISHED,
          });
          return shops
            .map((shop) => exportPublishedShop(shop, locations))
            .filter((shop): shop is PublishedShopExport => shop !== null);
        }),
    },
  };
}
