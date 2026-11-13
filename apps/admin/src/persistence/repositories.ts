import type { PublishedShopExport } from "../domain/export";
import type { ShopLocation } from "../domain/location";
import type { Shop } from "../domain/shop";

export interface ShopRepository {
  get(id: string): Promise<Shop | null>;
  list(): Promise<readonly Shop[]>;
  save(shop: Shop): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface LocationRepository {
  get(id: string): Promise<ShopLocation | null>;
  listByShop(shopId: string): Promise<readonly ShopLocation[]>;
  save(location: ShopLocation): Promise<void>;
  delete(id: string): Promise<void>;
}

// Read-only and limited to published, source-free data for the public path.
export interface PublishedShopReader {
  get(shopId: string): Promise<PublishedShopExport | null>;
  list(): Promise<readonly PublishedShopExport[]>;
}

export interface Repositories {
  readonly shops: ShopRepository;
  readonly locations: LocationRepository;
  readonly published: PublishedShopReader;
}
