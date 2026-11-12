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

export interface ShopLocation {
  id: string;
  shopId: string;
  regionId: string;
  cityId: string;
  neighborhoodId: string | null;
  type: LocationType;
  status: "draft" | "published";
  coordinates: { latitude: number; longitude: number } | null;
  roasters: readonly string[] | null;
  coffeeOptions: readonly CoffeeOption[] | null;
  nonCoffeeDrinks: boolean | null;
  food: readonly FoodOption[] | null;
}

export function validateCoordinates(
  coordinates: ShopLocation["coordinates"],
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
