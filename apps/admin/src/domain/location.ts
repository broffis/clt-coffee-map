import { copyRegularHours, type RegularHours } from "./hours";
import { type ContactLinks, copyContactLinks } from "./links";

export type LocationType =
  | "cafe"
  | "bakery"
  | "mobile coffee"
  | "coffee roaster";

export type CoffeeOption =
  | "espresso"
  | "drip"
  | "pour-over"
  | "cold brew"
  | "milk drinks";

export type FoodOption =
  | "baked goods"
  | "sandwiches"
  | "full menu"
  | "breakfast items"
  | "salads";

export interface LocationDetails {
  readonly regionId: string;
  readonly cityId: string;
  readonly neighborhoodId: string | null;
  readonly type: LocationType;
  readonly coordinates: {
    readonly latitude: number;
    readonly longitude: number;
  } | null;
  readonly address: {
    readonly streetLine1: string | null;
    readonly streetLine2: string | null;
    readonly postalCode: string | null;
  } | null;
  readonly links: ContactLinks | null;
  readonly hoursInfoUrl: string | null;
  readonly regularHours: RegularHours | null;
  readonly roasters: readonly string[] | null;
  readonly coffeeOptions: readonly CoffeeOption[] | null;
  readonly nonCoffeeDrinks: boolean | null;
  readonly food: readonly FoodOption[] | null;
}

export interface ShopLocation {
  readonly id: string;
  readonly shopId: string;
  readonly draft: LocationDetails;
  readonly published: LocationDetails | null;
}

export function publishLocationDetails(location: ShopLocation): ShopLocation {
  const { draft } = location;
  validateCoordinates(draft.coordinates);

  return {
    ...location,
    published: {
      ...draft,
      coordinates: draft.coordinates === null ? null : { ...draft.coordinates },
      address: draft.address === null ? null : { ...draft.address },
      links: copyContactLinks(draft.links),
      regularHours: copyRegularHours(draft.regularHours),
      roasters: draft.roasters === null ? null : [...draft.roasters],
      coffeeOptions:
        draft.coffeeOptions === null ? null : [...draft.coffeeOptions],
      food: draft.food === null ? null : [...draft.food],
    },
  };
}

export function validateCoordinates(
  coordinates: LocationDetails["coordinates"],
): void {
  if (coordinates === null) {
    return;
  }

  const { latitude, longitude } = coordinates;
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError("Coordinates must have valid latitude and longitude.");
  }
}
