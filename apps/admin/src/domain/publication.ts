import { validateIdentifier } from "./identifiers";
import { publishLocationDetails, type ShopLocation } from "./location";
import { publishShopDetails, type Shop } from "./shop";

export function publishShopLocation(
  shop: Shop,
  location: ShopLocation,
): { shop: Shop; location: ShopLocation } {
  validateIdentifier(shop.id, "Shop ID");
  if (location.shopId !== shop.id) {
    throw new Error("Location does not belong to the shop.");
  }

  return {
    shop: shop.published === null ? publishShopDetails(shop) : shop,
    location: publishLocationDetails(location),
  };
}

export function unpublishLocation(location: ShopLocation): ShopLocation {
  return { ...location, published: null };
}

export function isShopVisible(
  shop: Shop,
  locations: readonly ShopLocation[],
): boolean {
  return (
    shop.published !== null &&
    locations.some(
      (location) => location.shopId === shop.id && location.published !== null,
    )
  );
}
