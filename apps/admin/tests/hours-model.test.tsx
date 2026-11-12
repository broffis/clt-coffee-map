import { describe, expect, it } from "vitest";
import {
  type LocationDetails,
  publishLocationDetails,
  type ShopLocation,
} from "../src/domain/location";

describe("regular hours", () => {
  it("snapshots split and overnight hours and their verification details", () => {
    const periods = [
      { opensAt: "08:00", closesAt: "12:00", closesNextDay: false },
      { opensAt: "20:00", closesAt: "02:00", closesNextDay: true },
    ];
    const source = {
      url: "https://example.com/hours",
      verifiedOn: "2026-11-12",
    };
    const hours: NonNullable<LocationDetails["regularHours"]> = {
      timeZone: "America/New_York",
      days: {
        monday: { status: "open", periods },
        tuesday: { status: "unknown" },
        wednesday: { status: "closed" },
        thursday: { status: "unknown" },
        friday: { status: "unknown" },
        saturday: { status: "unknown" },
        sunday: { status: "unknown" },
      },
      source,
    };
    const location: ShopLocation = {
      id: "location-1",
      shopId: "shop-1",
      draft: {
        regionId: "region-1",
        cityId: "city-1",
        neighborhoodId: null,
        type: "cafe",
        coordinates: null,
        address: null,
        links: null,
        hoursInfoUrl: "https://example.com/hours",
        regularHours: hours,
        roasters: null,
        coffeeOptions: null,
        nonCoffeeDrinks: null,
        food: null,
        sources: null,
      },
      published: null,
    };

    const result = publishLocationDetails(location);
    periods[0].opensAt = "09:00";
    periods.push({ opensAt: "03:00", closesAt: "04:00", closesNextDay: false });
    source.verifiedOn = "2026-11-13";

    expect(result.published?.regularHours?.days.monday).toEqual({
      status: "open",
      periods: [
        { opensAt: "08:00", closesAt: "12:00", closesNextDay: false },
        { opensAt: "20:00", closesAt: "02:00", closesNextDay: true },
      ],
    });
    expect(result.published?.regularHours?.days.tuesday).toEqual({
      status: "unknown",
    });
    expect(result.published?.regularHours?.days.wednesday).toEqual({
      status: "closed",
    });
    expect(result.published?.regularHours?.source.verifiedOn).toBe(
      "2026-11-12",
    );
    expect(result.published?.hoursInfoUrl).toBe("https://example.com/hours");
  });
});
