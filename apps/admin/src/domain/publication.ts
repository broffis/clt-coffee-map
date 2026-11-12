import { publishLocationDetails, type ShopLocation } from "./location";
import { publishShopDetails, type Shop } from "./shop";

export function publishShopLocation(
  shop: Shop,
  location: ShopLocation,
): { shop: Shop; location: ShopLocation } {
  if (location.shopId !== shop.id) {
    throw new Error("Location does not belong to the shop.");
  }

  return {
    shop: shop.published === null ? publishShopDetails(shop) : shop,
    location: publishLocationDetails(location),
  };
}
