import type {
  PublicJsonObject,
  PublicLocation,
  PublicShop,
} from "./public-data/public-reader";

export const locationTypes = [
  "cafe",
  "bakery",
  "mobile coffee",
  "coffee roaster",
] as const;

export interface DiscoveryLocation {
  readonly id: string;
  readonly shopId: string;
  readonly shopName: string;
  readonly neighborhoodId: string | null;
  readonly type: string | null;
  readonly coordinates: readonly [number, number] | null;
  readonly details: PublicJsonObject;
}

export interface DiscoveryShop {
  readonly id: string;
  readonly name: string;
  readonly details: PublicJsonObject;
  readonly locations: readonly DiscoveryLocation[];
}

export interface DiscoveryFilters {
  readonly search: string;
  readonly neighborhoodId: string;
  readonly type: string;
  readonly mapBounds: MapBounds | null;
}

export interface MapBounds {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}

export function createDiscoveryShops(
  shops: readonly PublicShop[],
): readonly DiscoveryShop[] {
  return shops.map((shop) => ({
    id: shop.id,
    name: stringValue(shop.details.name) ?? "Unnamed coffee shop",
    details: shop.details,
    locations: shop.locations.map((location) =>
      toDiscoveryLocation(
        location,
        stringValue(shop.details.name) ?? "Unnamed coffee shop",
      ),
    ),
  }));
}

export function filterDiscoveryShops(
  shops: readonly DiscoveryShop[],
  filters: DiscoveryFilters,
): readonly DiscoveryShop[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return shops.flatMap((shop) => {
    const matchesSearch =
      search === "" ||
      shop.name.toLocaleLowerCase().includes(search) ||
      shop.locations.some((location) =>
        locationNeighborhood(location)?.toLocaleLowerCase().includes(search),
      );
    if (!matchesSearch) {
      return [];
    }
    const locations = shop.locations.filter((location) =>
      matchesLocation(location, filters),
    );
    return locations.length === 0 ? [] : [{ ...shop, locations }];
  });
}

export function getNeighborhoods(
  shops: readonly DiscoveryShop[],
): readonly string[] {
  return [
    ...unique(
      shops.flatMap((shop) =>
        shop.locations.flatMap((location) => {
          const neighborhood = locationNeighborhood(location);
          return neighborhood === null ? [] : [neighborhood];
        }),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function getTypes(shops: readonly DiscoveryShop[]): readonly string[] {
  return [
    ...unique(
      shops.flatMap((shop) =>
        shop.locations.flatMap((location) =>
          location.type === null ? [] : [location.type],
        ),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function mapLocations(
  shops: readonly DiscoveryShop[],
): readonly DiscoveryLocation[] {
  return shops.flatMap((shop) =>
    shop.locations.filter(
      (location): location is DiscoveryLocation =>
        location.coordinates !== null,
    ),
  );
}

export function formatLocation(location: DiscoveryLocation): string {
  const details = location.details;
  const address = addressValue(details.address);
  const city = stringValue(details.cityId);
  return [address, city].filter(Boolean).join(", ");
}

function toDiscoveryLocation(
  location: PublicLocation,
  shopName: string,
): DiscoveryLocation {
  return {
    id: location.id,
    shopId: location.shopId,
    shopName,
    neighborhoodId: stringValue(location.details.neighborhoodId),
    type: stringValue(location.details.type),
    coordinates: coordinatesValue(location.details.coordinates),
    details: location.details,
  };
}

function matchesLocation(
  location: DiscoveryLocation,
  filters: DiscoveryFilters,
): boolean {
  return (
    (filters.neighborhoodId === "" ||
      location.neighborhoodId === filters.neighborhoodId) &&
    (filters.type === "" || location.type === filters.type) &&
    (filters.mapBounds === null ||
      (location.coordinates !== null &&
        isInBounds(location.coordinates, filters.mapBounds)))
  );
}

function isInBounds(
  coordinates: readonly [number, number],
  bounds: MapBounds,
): boolean {
  const [latitude, longitude] = coordinates;
  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

function coordinatesValue(value: unknown): readonly [number, number] | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "latitude" in value &&
    "longitude" in value
  ) {
    const latitude = value.latitude;
    const longitude = value.longitude;
    return coordinatesValue([latitude, longitude]);
  }
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    value[0] < -90 ||
    value[0] > 90 ||
    value[1] < -180 ||
    value[1] > 180
  ) {
    return null;
  }
  return [value[0], value[1]];
}

function locationNeighborhood(location: DiscoveryLocation): string | null {
  return location.neighborhoodId;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function addressValue(value: unknown): string | null {
  if (typeof value === "string") {
    return stringValue(value);
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const address = value as {
    streetLine1?: unknown;
    streetLine2?: unknown;
    postalCode?: unknown;
  };
  return (
    [
      stringValue(address.streetLine1),
      stringValue(address.streetLine2),
      stringValue(address.postalCode),
    ]
      .filter((part): part is string => part !== null)
      .join(", ") || null
  );
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
