import { describe, expect, it } from "vitest";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";
import { PersistenceError } from "../src/persistence/errors";
import { createInMemoryRepositories } from "../src/persistence/memory";
import { createMongoRepositories } from "../src/persistence/mongo-repositories";
import {
  exportSnapshot,
  importSnapshot,
  parseSnapshot,
  SNAPSHOT_FORMAT,
} from "../src/persistence/snapshot";
import { createFakeDatabase } from "./fake-mongo";

function shop(id: string, published: boolean): Shop {
  const details = {
    name: `Shop ${id}`,
    links: { website: "https://shop.example.com", other: [] },
    sources: [
      {
        name: "Private source",
        url: "https://source.example.com",
        recordId: "source-1",
        release: null,
        license: null,
        verifiedOn: "2026-01-01",
        fields: ["name" as const],
      },
    ],
  };
  return {
    id,
    draft: { ...details, name: `Draft ${id}` },
    published: published ? details : null,
  };
}

function location(
  id: string,
  shopId: string,
  published: boolean,
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
  return { id, shopId, draft: details, published: published ? details : null };
}

async function seeded() {
  const repositories = createInMemoryRepositories();
  await repositories.shops.save(shop("shop-2", false));
  await repositories.shops.save(shop("shop-1", true));
  await repositories.locations.save(location("location-1", "shop-1", true));
  await repositories.locations.save(location("location-2", "shop-1", false));
  await repositories.locations.save(location("location-3", "shop-2", false));
  return repositories;
}

function validSnapshot() {
  return JSON.parse(
    JSON.stringify({
      format: SNAPSHOT_FORMAT,
      version: 1,
      shops: [shop("shop-1", true)],
      locations: [location("location-1", "shop-1", true)],
    }),
  );
}

describe("data snapshot", () => {
  it("exports every record, including drafts and sources, in ID order", async () => {
    const snapshot = await exportSnapshot(await seeded());

    expect(snapshot.format).toBe(SNAPSHOT_FORMAT);
    expect(snapshot.version).toBe(1);
    expect(snapshot.shops.map(({ id }) => id)).toEqual(["shop-1", "shop-2"]);
    expect(snapshot.locations.map(({ id }) => id)).toEqual([
      "location-1",
      "location-2",
      "location-3",
    ]);
    expect(snapshot.shops[0]?.published?.sources).not.toBeNull();
  });

  it("round-trips through JSON into another implementation", async () => {
    const original = await exportSnapshot(await seeded());
    const target = createMongoRepositories(createFakeDatabase());

    await importSnapshot(target, JSON.parse(JSON.stringify(original)));

    expect(await exportSnapshot(target)).toEqual(original);
  });

  it("refuses to import into a database that already has shops", async () => {
    const snapshot = await exportSnapshot(await seeded());
    const target = await seeded();

    const error = await importSnapshot(target, snapshot).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(PersistenceError);
    expect((error as PersistenceError).code).toBe("conflict");
  });

  it("writes nothing when the snapshot is invalid", async () => {
    const target = createInMemoryRepositories();
    const snapshot = validSnapshot();
    snapshot.locations[0].shopId = "missing-shop";

    await expect(importSnapshot(target, snapshot)).rejects.toThrow(
      PersistenceError,
    );
    expect(await target.shops.list()).toEqual([]);
  });

  it("accepts a valid snapshot", () => {
    expect(parseSnapshot(validSnapshot()).shops).toHaveLength(1);
  });

  it.each([
    ["a non-object", "text"],
    ["null", null],
    ["another format", { ...validSnapshot(), format: "other" }],
    ["an unsupported version", { ...validSnapshot(), version: 2 }],
    ["non-array shops", { ...validSnapshot(), shops: {} }],
    ["non-array locations", { ...validSnapshot(), locations: null }],
  ])("rejects %s", (_name, input) => {
    expect(() => parseSnapshot(input)).toThrow(PersistenceError);
  });

  it.each([
    [
      "a malformed shop",
      (s: ReturnType<typeof validSnapshot>) => (s.shops[0] = "x"),
    ],
    [
      "a shop without a draft",
      (s: ReturnType<typeof validSnapshot>) => (s.shops[0].draft = null),
    ],
    [
      "a blank shop ID",
      (s: ReturnType<typeof validSnapshot>) => (s.shops[0].id = " "),
    ],
    [
      "a duplicate shop ID",
      (s: ReturnType<typeof validSnapshot>) =>
        s.shops.push(structuredClone(s.shops[0])),
    ],
    [
      "a malformed location",
      (s: ReturnType<typeof validSnapshot>) => (s.locations[0] = 1),
    ],
    [
      "a location without a draft",
      (s: ReturnType<typeof validSnapshot>) =>
        (s.locations[0].draft = undefined),
    ],
    [
      "a duplicate location ID",
      (s: ReturnType<typeof validSnapshot>) =>
        s.locations.push(structuredClone(s.locations[0])),
    ],
    [
      "a location for an unknown shop",
      (s: ReturnType<typeof validSnapshot>) =>
        (s.locations[0].shopId = "other"),
    ],
    [
      "an invalid published shop",
      (s: ReturnType<typeof validSnapshot>) =>
        (s.shops[0].published.name = " "),
    ],
    [
      "an HTTP published link",
      (s: ReturnType<typeof validSnapshot>) =>
        (s.shops[0].published.links.website = "http://shop.example.com"),
    ],
    [
      "an invalid published location",
      (s: ReturnType<typeof validSnapshot>) =>
        (s.locations[0].published.type = "kiosk"),
    ],
  ])("rejects %s", (_name, mutate) => {
    const snapshot = validSnapshot();
    mutate(snapshot);

    expect(() => parseSnapshot(snapshot)).toThrow(PersistenceError);
  });
});
