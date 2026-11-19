import { describe, expect, it } from "vitest";
import {
  createPublicMongoReader,
  type PublicDocumentCollection,
  type PublicMongoDatabase,
} from "../src/public-data/public-reader";

class FakeCollection
  implements PublicDocumentCollection<Record<string, unknown>>
{
  constructor(private readonly documents: Record<string, unknown>[]) {}

  async findOne(filter: Record<string, unknown>) {
    const id = filter._id;
    return (this.documents.find((document) => document._id === id) ??
      null) as Record<string, unknown> | null;
  }

  find() {
    return {
      toArray: async () => structuredClone(this.documents),
    };
  }
}

function database(): PublicMongoDatabase {
  const shops = [
    {
      _id: "shop-1",
      published: {
        name: "Published shop",
        links: null,
        sources: ["private source"],
        privateNote: "do not export",
      },
    },
    {
      _id: "shop-2",
      published: null,
    },
  ];
  const locations = [
    {
      _id: "location-1",
      shopId: "shop-1",
      published: {
        regionId: "region-1",
        cityId: "city-1",
        type: "cafe",
        sources: ["private source"],
        privateNote: "do not export",
      },
    },
    {
      _id: "location-2",
      shopId: "shop-2",
      published: {
        regionId: "region-1",
        cityId: "city-1",
        type: "cafe",
      },
    },
    {
      _id: "location-3",
      shopId: "shop-1",
      published: null,
    },
  ];
  return {
    collection(name: string) {
      return new FakeCollection(
        name === "shops" ? shops : locations,
      ) as unknown as PublicDocumentCollection<never>;
    },
  };
}

describe("public Mongo reader", () => {
  it("returns only published, allowlisted shop and location fields", async () => {
    const reader = createPublicMongoReader(database());

    await expect(reader.list()).resolves.toEqual([
      {
        id: "shop-1",
        details: { name: "Published shop", links: null },
        locations: [
          {
            id: "location-1",
            shopId: "shop-1",
            details: {
              regionId: "region-1",
              cityId: "city-1",
              type: "cafe",
            },
          },
        ],
      },
    ]);
  });

  it("does not return a shop without a published location", async () => {
    const reader = createPublicMongoReader(database());

    await expect(reader.get("shop-2")).resolves.toBeNull();
  });

  it("handles an empty public shop collection", async () => {
    const reader = createPublicMongoReader({
      collection() {
        return new FakeCollection(
          [],
        ) as unknown as PublicDocumentCollection<never>;
      },
    });

    await expect(reader.list()).resolves.toEqual([]);
  });

  it("rejects unsupported public values", async () => {
    const invalidDatabase: PublicMongoDatabase = {
      collection(name: string) {
        const documents =
          name === "shops"
            ? [{ _id: "shop-1", published: { name: () => "invalid" } }]
            : [];
        return {
          findOne: async () => documents[0] ?? null,
          find: () => ({ toArray: async () => documents }),
        } as unknown as PublicDocumentCollection<never>;
      },
    };

    await expect(
      createPublicMongoReader(invalidDatabase).list(),
    ).rejects.toThrow("Public shop data is unavailable.");
  });

  it("hides a published shop with no published locations", async () => {
    const reader = createPublicMongoReader({
      collection(name: string) {
        return new FakeCollection(
          name === "shops"
            ? [{ _id: "shop-1", published: { name: "Shop" } }]
            : [],
        ) as unknown as PublicDocumentCollection<never>;
      },
    });

    await expect(reader.get("shop-1")).resolves.toBeNull();
  });
});
