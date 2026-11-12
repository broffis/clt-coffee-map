import { describe, expect, it } from "vitest";
import type { ShopLocation } from "../src/domain/location";
import { publishShopLocation } from "../src/domain/publication";
import type { Shop } from "../src/domain/shop";

function location(shopId = "shop-1"): ShopLocation {
  return {
    id: "location-1",
    shopId,
    draft: {
      regionId: "region-1",
      cityId: "city-1",
      neighborhoodId: null,
      type: "cafe",
      coordinates: { latitude: 35.2, longitude: -80.8 },
      roasters: null,
      coffeeOptions: null,
      nonCoffeeDrinks: null,
      food: null,
    },
    published: null,
  };
}

describe("publishing a shop location", () => {
  it("includes the shared details when publishing the first location", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop" },
      published: null,
    };
    const draftLocation = location();

    const result = publishShopLocation(shop, draftLocation);

    expect(result.shop.published).toEqual({ name: "Coffee shop" });
    expect(result.location.published).toEqual(draftLocation.draft);
    expect(shop.published).toBeNull();
    expect(draftLocation.published).toBeNull();
  });

  it("keeps later shared edits private when publishing a location", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "New name" },
      published: { name: "Previous name" },
    };

    const result = publishShopLocation(shop, location());

    expect(result.shop.published).toEqual({ name: "Previous name" });
    expect(result.location.published).not.toBeNull();
  });

  it("rejects a location belonging to another shop", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop" },
      published: null,
    };

    expect(() => publishShopLocation(shop, location("shop-2"))).toThrow(
      "Location does not belong to the shop.",
    );
    expect(shop.published).toBeNull();
  });

  it("rejects the first location if its shared shop name is blank", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: " " },
      published: null,
    };
    const draftLocation = location();

    expect(() => publishShopLocation(shop, draftLocation)).toThrow(RangeError);
    expect(draftLocation.published).toBeNull();
    expect(shop.published).toBeNull();
  });
});
