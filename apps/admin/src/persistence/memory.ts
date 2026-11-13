import {
  exportPublishedShop,
  type PublishedShopExport,
} from "../domain/export";
import { validateIdentifier } from "../domain/identifiers";
import type { ShopLocation } from "../domain/location";
import type { Shop } from "../domain/shop";
import { PersistenceError } from "./errors";
import type { Repositories } from "./repositories";

function checkIdentifier(id: string, field: string): void {
  try {
    validateIdentifier(id, field);
  } catch (error) {
    throw new PersistenceError("validation", (error as Error).message);
  }
}

function byId<T extends { readonly id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}

export function createInMemoryRepositories(): Repositories {
  const shops = new Map<string, Shop>();
  const locations = new Map<string, ShopLocation>();

  const locationsOf = (shopId: string): ShopLocation[] =>
    [...locations.values()].filter((location) => location.shopId === shopId);

  const exportShop = (shop: Shop): PublishedShopExport | null =>
    exportPublishedShop(shop, locationsOf(shop.id));

  return {
    shops: {
      async get(id) {
        checkIdentifier(id, "Shop ID");
        const shop = shops.get(id);
        return shop === undefined ? null : structuredClone(shop);
      },
      async list() {
        return [...shops.values()]
          .sort(byId)
          .map((shop) => structuredClone(shop));
      },
      async save(shop) {
        checkIdentifier(shop.id, "Shop ID");
        shops.set(shop.id, structuredClone(shop));
      },
      async delete(id) {
        checkIdentifier(id, "Shop ID");
        if (!shops.has(id)) {
          throw new PersistenceError("not-found", "Shop does not exist.");
        }
        if (locationsOf(id).length > 0) {
          throw new PersistenceError("conflict", "Shop still has locations.");
        }
        shops.delete(id);
      },
    },
    locations: {
      async get(id) {
        checkIdentifier(id, "Location ID");
        const location = locations.get(id);
        return location === undefined ? null : structuredClone(location);
      },
      async listByShop(shopId) {
        checkIdentifier(shopId, "Shop ID");
        return locationsOf(shopId)
          .sort(byId)
          .map((location) => structuredClone(location));
      },
      async save(location) {
        checkIdentifier(location.id, "Location ID");
        checkIdentifier(location.shopId, "Shop ID");
        if (!shops.has(location.shopId)) {
          throw new PersistenceError(
            "missing-reference",
            "Location's shop does not exist.",
          );
        }
        const existing = locations.get(location.id);
        if (existing !== undefined && existing.shopId !== location.shopId) {
          throw new PersistenceError(
            "conflict",
            "Location cannot move to another shop.",
          );
        }
        locations.set(location.id, structuredClone(location));
      },
      async delete(id) {
        checkIdentifier(id, "Location ID");
        if (!locations.delete(id)) {
          throw new PersistenceError("not-found", "Location does not exist.");
        }
      },
    },
    published: {
      async get(shopId) {
        checkIdentifier(shopId, "Shop ID");
        const shop = shops.get(shopId);
        return shop === undefined ? null : exportShop(shop);
      },
      async list() {
        return [...shops.values()]
          .sort(byId)
          .map(exportShop)
          .filter((shop) => shop !== null);
      },
    },
  };
}
