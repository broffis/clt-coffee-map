import {
  copyRegularHours,
  type RegularHours,
  validateRegularHours,
} from "./hours";
import { validateIdentifier } from "./identifiers";
import {
  type ContactLinks,
  copyContactLinks,
  validateContactLinks,
} from "./links";
import { copySources, type SourceReference, validateSources } from "./sources";
import {
  validateHttpsUrl,
  validateOptionalText,
  validateUniqueNonBlankValues,
} from "./validation";

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

export type LocationSourceField =
  | "regionId"
  | "cityId"
  | "neighborhoodId"
  | "type"
  | "coordinates"
  | "address"
  | "links"
  | "hoursInfoUrl"
  | "roasters"
  | "coffeeOptions"
  | "nonCoffeeDrinks"
  | "food";

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
  readonly sources: readonly SourceReference<LocationSourceField>[] | null;
}

export interface ShopLocation {
  readonly id: string;
  readonly shopId: string;
  readonly draft: LocationDetails;
  readonly published: LocationDetails | null;
}

export function publishLocationDetails(location: ShopLocation): ShopLocation {
  const { draft } = location;
  validateIdentifier(location.id, "Location ID");
  validateIdentifier(location.shopId, "Shop ID");
  validateIdentifier(draft.regionId, "Region ID");
  validateIdentifier(draft.cityId, "City ID");
  if (draft.neighborhoodId !== null) {
    validateIdentifier(draft.neighborhoodId, "Neighborhood ID");
  }
  validateCoordinates(draft.coordinates);
  validateAddress(draft.address);
  validateContactLinks(draft.links);
  if (draft.hoursInfoUrl !== null) {
    validateHttpsUrl(draft.hoursInfoUrl, "Hours information URL");
  }
  validateRegularHours(draft.regularHours);
  validateLocationValues(draft);
  validateSources(draft.sources, [
    "regionId",
    "cityId",
    "neighborhoodId",
    "type",
    "coordinates",
    "address",
    "links",
    "hoursInfoUrl",
    "roasters",
    "coffeeOptions",
    "nonCoffeeDrinks",
    "food",
  ]);

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
      sources: copySources(draft.sources),
    },
  };
}

function validateAddress(address: LocationDetails["address"]): void {
  if (address === null) {
    return;
  }

  validateOptionalText(address.streetLine1, "Address street line 1");
  validateOptionalText(address.streetLine2, "Address street line 2");
  validateOptionalText(address.postalCode, "Address postal code");
  if (
    address.streetLine1 === null &&
    address.streetLine2 === null &&
    address.postalCode === null
  ) {
    throw new RangeError("An address must contain at least one value.");
  }
}

function validateLocationValues(details: LocationDetails): void {
  if (
    !["cafe", "bakery", "mobile coffee", "coffee roaster"].includes(
      details.type,
    )
  ) {
    throw new RangeError(`Unsupported location type: ${details.type}.`);
  }
  if (details.roasters !== null) {
    validateUniqueNonBlankValues(details.roasters, "Roasters");
  }
  if (details.coffeeOptions !== null) {
    validateUniqueNonBlankValues(details.coffeeOptions, "Coffee options");
    for (const option of details.coffeeOptions) {
      if (
        !["espresso", "drip", "pour-over", "cold brew", "milk drinks"].includes(
          option,
        )
      ) {
        throw new RangeError(`Unsupported coffee option: ${option}.`);
      }
    }
  }
  if (details.food !== null) {
    validateUniqueNonBlankValues(details.food, "Food options");
    for (const option of details.food) {
      if (
        ![
          "baked goods",
          "sandwiches",
          "full menu",
          "breakfast items",
          "salads",
        ].includes(option)
      ) {
        throw new RangeError(`Unsupported food option: ${option}.`);
      }
    }
  }
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
