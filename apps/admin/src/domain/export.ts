import { copyRegularHours } from "./hours";
import type { LocationDetails, ShopLocation } from "./location";
import { copyContactLinks } from "./links";
import type { Shop, ShopDetails } from "./shop";

export type PublishedShopDetails = Omit<ShopDetails, "sources">;
export type PublishedLocationDetails = Omit<LocationDetails, "sources">;

export interface PublishedLocationExport {
  readonly id: string;
  readonly shopId: string;
  readonly details: PublishedLocationDetails;
}

export interface PublishedShopExport {
  readonly id: string;
  readonly details: PublishedShopDetails;
  readonly locations: readonly PublishedLocationExport[];
}

export function exportPublishedShop(
  shop: Shop,
  locations: readonly ShopLocation[],
): PublishedShopExport | null {
  if (shop.published === null) {
    return null;
  }

  const publishedLocations = locations.filter(isPublishedLocationFor(shop.id));
  if (publishedLocations.length === 0) {
    return null;
  }

  return {
    id: shop.id,
    details: copyPublishedShopDetails(shop.published),
    locations: publishedLocations.map((location) => ({
      id: location.id,
      shopId: location.shopId,
      details: copyPublishedLocationDetails(location.published),
    })),
  };
}

function isPublishedLocationFor(shopId: string): (
  location: ShopLocation,
) => location is ShopLocation & {
  readonly published: NonNullable<ShopLocation["published"]>;
} {
  return (
    location,
  ): location is ShopLocation & {
    readonly published: NonNullable<ShopLocation["published"]>;
  } => location.shopId === shopId && location.published !== null;
}

function copyPublishedShopDetails(details: ShopDetails): PublishedShopDetails {
  return {
    name: details.name,
    links: copyContactLinks(details.links),
  };
}

function copyPublishedLocationDetails(
  details: LocationDetails,
): PublishedLocationDetails {
  return {
    regionId: details.regionId,
    cityId: details.cityId,
    neighborhoodId: details.neighborhoodId,
    type: details.type,
    coordinates:
      details.coordinates === null ? null : { ...details.coordinates },
    address: details.address === null ? null : { ...details.address },
    links: copyContactLinks(details.links),
    hoursInfoUrl: details.hoursInfoUrl,
    regularHours: copyRegularHours(details.regularHours),
    roasters: details.roasters === null ? null : [...details.roasters],
    coffeeOptions:
      details.coffeeOptions === null ? null : [...details.coffeeOptions],
    nonCoffeeDrinks: details.nonCoffeeDrinks,
    food: details.food === null ? null : [...details.food],
  };
}
