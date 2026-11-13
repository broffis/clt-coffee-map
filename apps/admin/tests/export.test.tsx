import { describe, expect, it } from "vitest";
import {
  exportPublishedShop,
  type PublishedShopExport,
} from "../src/domain/export";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";

function shop(): Shop {
  return {
    id: "shop-1",
    draft: {
      name: "Draft name",
      links: { website: "https://draft.example.com", other: [] },
      sources: null,
    },
    published: {
      name: "Published name",
      links: { website: "https://published.example.com", other: [] },
      sources: [
        {
          name: "Private source",
          url: "https://source.example.com",
          recordId: "source-1",
          release: "2026-11",
          license: "Example",
          verifiedOn: "2026-01-01",
          fields: ["name"],
        },
      ],
    },
  };
}

function location(
  id = "location-1",
  shopId = "shop-1",
  published: boolean,
): ShopLocation {
  const details = {
    regionId: "region-1",
    cityId: "city-1",
    neighborhoodId: null,
    type: "cafe" as const,
    coordinates: { latitude: 35.2, longitude: -80.8 },
    address: null,
    links: null,
    hoursInfoUrl: null,
    regularHours: null,
    roasters: null,
    coffeeOptions: null,
    nonCoffeeDrinks: null,
    food: null,
    sources: [
      {
        name: "Private source",
        url: null,
        recordId: "source-2",
        release: null,
        license: null,
        verifiedOn: null,
        fields: ["coordinates" as const],
      },
    ],
  };

  return {
    id,
    shopId,
    draft: { ...details, type: "bakery" },
    published: published ? details : null,
  };
}

describe("published export", () => {
  it("exports only published details and matching published locations", () => {
    const result = exportPublishedShop(shop(), [
      location("location-1", "shop-1", true),
      location("location-2", "shop-1", false),
      location("location-3", "shop-2", true),
    ]);

    expect(result).toEqual<PublishedShopExport>({
      id: "shop-1",
      details: {
        name: "Published name",
        links: { website: "https://published.example.com", other: [] },
      },
      locations: [
        {
          id: "location-1",
          shopId: "shop-1",
          details: {
            regionId: "region-1",
            cityId: "city-1",
            neighborhoodId: null,
            type: "cafe",
            coordinates: { latitude: 35.2, longitude: -80.8 },
            address: null,
            links: null,
            hoursInfoUrl: null,
            regularHours: null,
            roasters: null,
            coffeeOptions: null,
            nonCoffeeDrinks: null,
            food: null,
          },
        },
      ],
    });
  });

  it("returns no public record without published shop and location data", () => {
    expect(exportPublishedShop({ ...shop(), published: null }, [])).toBeNull();
    expect(
      exportPublishedShop(shop(), [location("location-1", "shop-1", false)]),
    ).toBeNull();
  });

  it("copies nested published values without exporting provenance", () => {
    const sourceLocation = location("location-1", "shop-1", true);
    if (sourceLocation.published === null) {
      throw new Error("Expected a published location fixture.");
    }
    const publishedDetails = sourceLocation.published;

    const fullLocation: ShopLocation = {
      ...sourceLocation,
      published: {
        ...publishedDetails,
        address: {
          streetLine1: "123 Main Street",
          streetLine2: "Suite 2",
          postalCode: "28202",
        },
        links: {
          website: "https://location.example.com",
          other: [{ label: "Menu", url: "https://location.example.com/menu" }],
        },
        hoursInfoUrl: "https://location.example.com/hours",
        regularHours: {
          timeZone: "America/New_York",
          source: {
            url: "https://location.example.com/hours",
            verifiedOn: "2020-01-01",
          },
          days: {
            monday: { status: "unknown" },
            tuesday: { status: "closed" },
            wednesday: { status: "unknown" },
            thursday: { status: "closed" },
            friday: { status: "unknown" },
            saturday: { status: "closed" },
            sunday: { status: "unknown" },
          },
        },
        roasters: ["Local Roaster"],
        coffeeOptions: ["espresso"],
        nonCoffeeDrinks: true,
        food: ["baked goods"],
      },
    };

    const result = exportPublishedShop(shop(), [fullLocation]);

    expect(result?.locations[0].details).toMatchObject({
      address: {
        streetLine1: "123 Main Street",
        streetLine2: "Suite 2",
        postalCode: "28202",
      },
      links: {
        website: "https://location.example.com",
      },
      hoursInfoUrl: "https://location.example.com/hours",
      roasters: ["Local Roaster"],
      coffeeOptions: ["espresso"],
      nonCoffeeDrinks: true,
      food: ["baked goods"],
    });
    expect(result?.locations[0].details).not.toHaveProperty("sources");
    expect(result?.locations[0].details.links).not.toBe(publishedDetails.links);
    expect(result?.locations[0].details.regularHours).not.toBe(
      publishedDetails.regularHours,
    );
  });
});
