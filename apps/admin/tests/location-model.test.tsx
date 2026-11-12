import { describe, expect, it } from "vitest";
import {
  publishLocationDetails,
  type ShopLocation,
  validateCoordinates,
} from "../src/domain/location";

describe("location details", () => {
  it("publishes a separate snapshot without changing the existing location", () => {
    const coordinates = { latitude: 35.2, longitude: -80.8 };
    const roasters = ["Roaster"];
    const location: ShopLocation = {
      id: "location-1",
      shopId: "shop-1",
      draft: {
        regionId: "region-1",
        cityId: "city-1",
        neighborhoodId: null,
        type: "cafe",
        coordinates,
        roasters,
        coffeeOptions: ["espresso"],
        nonCoffeeDrinks: true,
        food: ["baked goods"],
      },
      published: null,
    };

    const result = publishLocationDetails(location);
    coordinates.latitude = 36;
    roasters.push("Another roaster");

    expect(result.published).toEqual({
      ...location.draft,
      coordinates: { latitude: 35.2, longitude: -80.8 },
      roasters: ["Roaster"],
    });
    expect(result.published?.coffeeOptions).not.toBe(
      location.draft.coffeeOptions,
    );
    expect(result.published?.food).not.toBe(location.draft.food);
    expect(location.published).toBeNull();
  });

  it("preserves unknown fields when republishing", () => {
    const location: ShopLocation = {
      id: "location-1",
      shopId: "shop-1",
      draft: {
        regionId: "region-1",
        cityId: "city-1",
        neighborhoodId: null,
        type: "mobile coffee",
        coordinates: null,
        roasters: null,
        coffeeOptions: null,
        nonCoffeeDrinks: null,
        food: null,
      },
      published: {
        regionId: "region-1",
        cityId: "city-1",
        neighborhoodId: null,
        type: "cafe",
        coordinates: { latitude: 35.2, longitude: -80.8 },
        roasters: [],
        coffeeOptions: [],
        nonCoffeeDrinks: false,
        food: [],
      },
    };

    expect(publishLocationDetails(location).published).toEqual(location.draft);
    expect(location.published?.type).toBe("cafe");
  });

  it("rejects invalid coordinates instead of replacing published details", () => {
    const location: ShopLocation = {
      id: "location-1",
      shopId: "shop-1",
      draft: {
        regionId: "region-1",
        cityId: "city-1",
        neighborhoodId: null,
        type: "cafe",
        coordinates: { latitude: 91, longitude: 0 },
        roasters: null,
        coffeeOptions: null,
        nonCoffeeDrinks: null,
        food: null,
      },
      published: null,
    };

    expect(() => publishLocationDetails(location)).toThrow(RangeError);
    expect(location.published).toBeNull();
  });
});

describe("location coordinates", () => {
  it("accepts missing coordinates and valid geographic limits", () => {
    expect(() => validateCoordinates(null)).not.toThrow();
    expect(() =>
      validateCoordinates({ latitude: 90, longitude: -180 }),
    ).not.toThrow();
    expect(() =>
      validateCoordinates({ latitude: -90, longitude: 180 }),
    ).not.toThrow();
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: -91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { latitude: 0, longitude: -181 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
  ])("rejects invalid coordinates: $latitude, $longitude", (coordinates) => {
    expect(() => validateCoordinates(coordinates)).toThrow(RangeError);
  });
});
