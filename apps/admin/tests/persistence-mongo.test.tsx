import type { Db } from "mongodb";
import { describe, expect, it } from "vitest";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";
import { PersistenceError } from "../src/persistence/errors";
import {
  createMongoRepositories,
  ensureMongoIndexes,
  type MongoDatabase,
} from "../src/persistence/mongo-repositories";
import { createFakeDatabase } from "./fake-mongo";

const shop: Shop = {
  id: "shop-1",
  draft: { name: "Draft", links: null, sources: null },
  published: null,
};

const location: ShopLocation = {
  id: "location-1",
  shopId: "shop-1",
  draft: {
    regionId: "region-1",
    cityId: "city-1",
    neighborhoodId: null,
    type: "cafe",
    coordinates: null,
    address: null,
    links: null,
    hoursInfoUrl: null,
    regularHours: null,
    roasters: null,
    coffeeOptions: null,
    nonCoffeeDrinks: null,
    food: null,
    sources: null,
  },
  published: null,
};

describe("Mongo repositories", () => {
  it("stores domain IDs as _id without a duplicate id field", async () => {
    const database = createFakeDatabase();
    const { shops, locations } = createMongoRepositories(database);
    await shops.save(shop);
    await locations.save(location);

    expect(database.collections.get("shops")?.documents).toEqual([
      { _id: "shop-1", draft: shop.draft, published: null },
    ]);
    expect(database.collections.get("locations")?.documents).toEqual([
      {
        _id: "location-1",
        shopId: "shop-1",
        draft: location.draft,
        published: null,
      },
    ]);
  });

  it("returns only known fields from stored documents", async () => {
    const database = createFakeDatabase();
    const { shops } = createMongoRepositories(database);
    await shops.save(shop);
    const stored = database.collections.get("shops")?.documents[0];
    if (stored === undefined) {
      throw new Error("Expected a stored shop.");
    }
    stored.legacyField = "unexpected";

    expect(await shops.get("shop-1")).toEqual(shop);
  });

  it("accepts the real driver database type", () => {
    const adapt = (database: Db): MongoDatabase => database;

    expect(adapt).toBeTypeOf("function");
  });

  it("creates the lookup indexes", async () => {
    const database = createFakeDatabase();
    await ensureMongoIndexes(database);

    expect(database.collections.get("locations")?.indexes).toEqual([
      { shopId: 1 },
    ]);
  });

  it("maps driver failures to a generic unavailable error", async () => {
    const database = createFakeDatabase();
    const { shops, locations, published } = createMongoRepositories(database);
    await shops.save(shop);
    for (const collection of database.collections.values()) {
      collection.failWith = new Error("mongodb://user:secret@host");
    }

    for (const operation of [
      shops.get("shop-1"),
      shops.list(),
      shops.save(shop),
      locations.save(location),
      published.get("shop-1"),
    ]) {
      const error = await operation.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as PersistenceError).code).toBe("unavailable");
      expect((error as PersistenceError).message).not.toContain("secret");
    }
  });
});
