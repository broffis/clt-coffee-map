import { describe, expect, it } from "vitest";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";
import { PersistenceError } from "../src/persistence/errors";
import { createInMemoryRepositories } from "../src/persistence/memory";

function shop(id = "shop-1", published = true): Shop {
  const details = {
    name: "Shop",
    links: { website: "https://shop.example.com", other: [] },
    sources: [
      {
        name: "Private source",
        url: null,
        recordId: "source-1",
        release: null,
        license: null,
        verifiedOn: null,
        fields: ["name" as const],
      },
    ],
  };

  return {
    id,
    draft: { ...details, name: "Draft" },
    published: published ? details : null,
  };
}

function location(
  id = "location-1",
  shopId = "shop-1",
  published = true,
): ShopLocation {
  const details = {
    regionId: "region-1",
    cityId: "city-1",
    neighborhoodId: null,
    type: "cafe" as const,
    coordinates: { latitude: 35.2, longitude: -80.8 },
    address: null,
    links: null,
    hoursInfoUrl: null,
    regularHours: null,
    roasters: null,
    coffeeOptions: null,
    nonCoffeeDrinks: null,
    food: null,
    sources: null,
  };

  return {
    id,
    shopId,
    draft: details,
    published: published ? details : null,
  };
}

async function failure(promise: Promise<unknown>): Promise<PersistenceError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(PersistenceError);
    return error as PersistenceError;
  }
  throw new Error("Expected the operation to fail.");
}

describe("in-memory repositories", () => {
  it("round-trips shops and locations as isolated copies", async () => {
    const { shops, locations } = createInMemoryRepositories();
    const original = shop();
    await shops.save(original);
    await locations.save(location());

    const stored = await shops.get("shop-1");
    expect(stored).toEqual(original);
    expect(stored).not.toBe(original);
    expect(stored?.draft.links).not.toBe(original.draft.links);
    expect(await locations.get("location-1")).toEqual(location());
    expect(await shops.get("missing")).toBeNull();
    expect(await locations.get("missing")).toBeNull();
  });

  it("lists shops and a shop's locations in stable ID order", async () => {
    const { shops, locations } = createInMemoryRepositories();
    await shops.save(shop("shop-2"));
    await shops.save(shop("shop-1"));
    await locations.save(location("location-b", "shop-1"));
    await locations.save(location("location-a", "shop-1"));
    await locations.save(location("location-c", "shop-2"));

    expect((await shops.list()).map(({ id }) => id)).toEqual([
      "shop-1",
      "shop-2",
    ]);
    expect((await locations.listByShop("shop-1")).map(({ id }) => id)).toEqual([
      "location-a",
      "location-b",
    ]);
  });

  it("rejects blank identifiers with a validation error", async () => {
    const { shops, locations } = createInMemoryRepositories();

    expect((await failure(shops.save(shop(" ")))).code).toBe("validation");
    expect((await failure(locations.save(location(" ")))).code).toBe(
      "validation",
    );
    expect((await failure(shops.get(" "))).code).toBe("validation");
    expect((await failure(locations.listByShop(""))).code).toBe("validation");
  });

  it("rejects a location whose shop does not exist", async () => {
    const { locations } = createInMemoryRepositories();

    const error = await failure(locations.save(location()));
    expect(error.code).toBe("missing-reference");
  });

  it("rejects moving a location to another shop", async () => {
    const { shops, locations } = createInMemoryRepositories();
    await shops.save(shop("shop-1"));
    await shops.save(shop("shop-2"));
    await locations.save(location("location-1", "shop-1"));

    const error = await failure(
      locations.save(location("location-1", "shop-2")),
    );
    expect(error.code).toBe("conflict");
  });

  it("refuses to delete a shop that still has locations", async () => {
    const { shops, locations } = createInMemoryRepositories();
    await shops.save(shop());
    await locations.save(location());

    expect((await failure(shops.delete("shop-1"))).code).toBe("conflict");

    await locations.delete("location-1");
    await shops.delete("shop-1");
    expect(await shops.get("shop-1")).toBeNull();
  });

  it("fails to delete records that do not exist", async () => {
    const { shops, locations } = createInMemoryRepositories();

    expect((await failure(shops.delete("missing"))).code).toBe("not-found");
    expect((await failure(locations.delete("missing"))).code).toBe("not-found");
  });

  it("reads only published shops without private fields", async () => {
    const { shops, locations, published } = createInMemoryRepositories();
    await shops.save(shop("shop-1"));
    await shops.save(shop("shop-2", false));
    await shops.save(shop("shop-3"));
    await locations.save(location("location-1", "shop-1"));
    await locations.save(location("location-2", "shop-2"));
    await locations.save(location("location-3", "shop-3", false));

    const result = await published.get("shop-1");
    expect(result?.details.name).toBe("Shop");
    expect(result?.locations.map(({ id }) => id)).toEqual(["location-1"]);
    expect(JSON.stringify(result)).not.toContain("Private source");
    expect(await published.get("shop-2")).toBeNull();
    expect(await published.get("shop-3")).toBeNull();
    expect(await published.get("missing")).toBeNull();
    expect((await published.list()).map(({ id }) => id)).toEqual(["shop-1"]);
  });
});
