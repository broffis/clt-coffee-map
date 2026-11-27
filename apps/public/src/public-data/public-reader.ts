import type { Document, Filter as MongoFilter } from "mongodb";

export type PublicJsonValue =
  | boolean
  | null
  | number
  | string
  | PublicJsonObject
  | readonly PublicJsonValue[];

export interface PublicJsonObject {
  readonly [key: string]: PublicJsonValue;
}

export interface PublicShop {
  readonly id: string;
  readonly details: PublicJsonObject;
  readonly locations: readonly PublicLocation[];
}

export interface PublicLocation {
  readonly id: string;
  readonly shopId: string;
  readonly details: PublicJsonObject;
}

export interface PublicShopReader {
  get(shopId: string): Promise<PublicShop | null>;
  list(): Promise<readonly PublicShop[]>;
}

export class PublicReadError extends Error {
  constructor() {
    super("Public shop data is unavailable.");
    this.name = "PublicReadError";
  }
}

export interface PublicDocumentCollection<T extends Document> {
  findOne(filter: MongoFilter<T>): Promise<T | null>;
  find(filter: MongoFilter<T>): { toArray(): Promise<T[]> };
}

export interface PublicMongoDatabase {
  collection<T extends Document>(name: string): PublicDocumentCollection<T>;
}

interface ShopDocument extends Document {
  _id: string;
  published: Record<string, unknown> | null;
}

interface LocationDocument extends Document {
  _id: string;
  shopId: string;
  published: Record<string, unknown> | null;
}

const PUBLISHED = { published: { $ne: null } };
const SHOP_PUBLIC_FIELDS = ["name", "links", "photos", "logoPhotoId"] as const;
const LOCATION_PUBLIC_FIELDS = [
  "regionId",
  "cityId",
  "neighborhoodId",
  "type",
  "coordinates",
  "address",
  "links",
  "hoursInfoUrl",
  "regularHours",
  "roasters",
  "coffeeOptions",
  "nonCoffeeDrinks",
  "food",
] as const;

function allowlist(
  details: Record<string, unknown>,
  fields: readonly string[],
): PublicJsonObject {
  return Object.fromEntries(
    fields
      .filter((field) => field in details)
      .map((field) => [field, toPublicValue(details[field])]),
  );
}

function toPublicValue(value: unknown): PublicJsonValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toPublicValue);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        toPublicValue(nested),
      ]),
    );
  }
  throw new PublicReadError();
}

function toShop(document: ShopDocument | null): PublicShop | null {
  if (document === null || document.published === null) {
    return null;
  }
  return {
    id: document._id,
    details: allowlist(document.published, SHOP_PUBLIC_FIELDS),
    locations: [],
  };
}

function toLocation(document: LocationDocument): PublicLocation | null {
  if (document.published === null) {
    return null;
  }
  return {
    id: document._id,
    shopId: document.shopId,
    details: allowlist(document.published, LOCATION_PUBLIC_FIELDS),
  };
}

export function createPublicMongoReader(
  database: PublicMongoDatabase,
): PublicShopReader {
  const shops = database.collection<ShopDocument>("shops");
  const locations = database.collection<LocationDocument>("locations");

  async function locationsFor(
    shopIds: readonly string[],
  ): Promise<readonly PublicLocation[]> {
    if (shopIds.length === 0) {
      return [];
    }
    return (
      await locations
        .find({
          shopId: { $in: shopIds },
          ...PUBLISHED,
        })
        .toArray()
    )
      .map(toLocation)
      .filter((location): location is PublicLocation => location !== null);
  }

  async function list(): Promise<readonly PublicShop[]> {
    const publicShops = (await shops.find(PUBLISHED).toArray())
      .map(toShop)
      .filter((shop): shop is PublicShop => shop !== null);
    const publicLocations = await locationsFor(
      publicShops.map((shop) => shop.id),
    );
    return publicShops
      .map((shop) => ({
        ...shop,
        locations: publicLocations.filter(
          (location) => location.shopId === shop.id,
        ),
      }))
      .filter((shop) => shop.locations.length > 0);
  }

  return {
    async get(shopId) {
      const shop = toShop(await shops.findOne({ _id: shopId }));
      if (shop === null) {
        return null;
      }
      const publicLocations = await locationsFor([shop.id]);
      if (publicLocations.length === 0) {
        return null;
      }
      return { ...shop, locations: publicLocations };
    },
    list,
  };
}
