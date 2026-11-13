import { describe, expect, it } from "vitest";
import {
  publishLocationDetails,
  type ShopLocation,
} from "../src/domain/location";
import { publishShopDetails, type Shop } from "../src/domain/shop";

describe("source provenance", () => {
  it("snapshots shop and location sources without sharing draft values", () => {
    const shopFields: ("name" | "links")[] = ["name"];
    const shopSource = {
      name: "Business website",
      url: "https://example.com",
      recordId: null,
      release: null,
      license: null,
      verifiedOn: "2026-11-12",
      fields: shopFields,
    };
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop", links: null, sources: [shopSource] },
      published: null,
    };
    const locationFields: ("address" | "coordinates")[] = ["address"];
    const locationSource = {
      name: "Overture",
      url: null,
      recordId: "source-1",
      release: "2026-10-21.0",
      license: "example license",
      verifiedOn: null,
      fields: locationFields,
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
        hoursInfoUrl: null,
        regularHours: null,
        roasters: null,
        coffeeOptions: null,
        nonCoffeeDrinks: null,
        food: null,
        sources: [locationSource],
      },
      published: null,
    };

    const publishedShop = publishShopDetails(shop);
    const publishedLocation = publishLocationDetails(location);
    shopSource.name = "Changed";
    shopFields.push("links");
    locationSource.recordId = "changed";
    locationFields.push("coordinates");

    expect(publishedShop.published?.sources).toEqual([
      { ...shopSource, name: "Business website", fields: ["name"] },
    ]);
    expect(publishedLocation.published?.sources).toEqual([
      { ...locationSource, recordId: "source-1", fields: ["address"] },
    ]);
  });
});
