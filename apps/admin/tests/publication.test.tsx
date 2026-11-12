import { describe, expect, it } from "vitest";
import type { ShopLocation } from "../src/domain/location";
import {
  isShopVisible,
  publishShopLocation,
  unpublishLocation,
} from "../src/domain/publication";
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
      address: null,
      links: null,
      hoursInfoUrl: null,
      regularHours: null,
      roasters: null,
      coffeeOptions: null,
      nonCoffeeDrinks: null,
      food: null,
      sources: null,
    },
    published: null,
  };
}

describe("shop location lifecycle", () => {
  it("includes the shared details when publishing the first location", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop", links: null, sources: null },
      published: null,
    };
    const draftLocation = location();

    const result = publishShopLocation(shop, draftLocation);

    expect(result.shop.published).toEqual({
      name: "Coffee shop",
      links: null,
      sources: null,
    });
    expect(result.location.published).toEqual(draftLocation.draft);
    expect(shop.published).toBeNull();
    expect(draftLocation.published).toBeNull();
  });

  describe("unpublishing a shop location", () => {
    it("retains the current draft and hides the shop when its last location is unpublished", () => {
      const shop: Shop = {
        id: "shop-1",
        draft: { name: "New name", links: null, sources: null },
        published: { name: "Previous name", links: null, sources: null },
      };
      const original = publishShopLocation(shop, location()).location;
      const edited: ShopLocation = {
        ...original,
        draft: { ...original.draft, type: "bakery" },
      };

      const unpublished = unpublishLocation(edited);

      expect(unpublished.published).toBeNull();
      expect(unpublished.draft.type).toBe("bakery");
      expect(edited.published?.type).toBe("cafe");
      expect(isShopVisible(shop, [original])).toBe(true);
      expect(isShopVisible(shop, [unpublished])).toBe(false);

      const restored = publishShopLocation(shop, unpublished);
      expect(restored.shop.published?.name).toBe("Previous name");
      expect(restored.location.published?.type).toBe("bakery");
      expect(isShopVisible(restored.shop, [restored.location])).toBe(true);
    });

    it("ignores other shops' locations and requires published shop details", () => {
      const shop: Shop = {
        id: "shop-1",
        draft: { name: "Coffee shop", links: null, sources: null },
        published: { name: "Coffee shop", links: null, sources: null },
      };
      const otherShop = { ...shop, id: "shop-2" };
      const otherLocation = publishShopLocation(
        otherShop,
        location("shop-2"),
      ).location;

      expect(isShopVisible(shop, [location(), otherLocation])).toBe(false);
      expect(
        isShopVisible({ ...shop, published: null }, [
          { ...location(), published: location().draft },
        ]),
      ).toBe(false);
    });

    it("stays visible while another location remains published", () => {
      const shop: Shop = {
        id: "shop-1",
        draft: { name: "Coffee shop", links: null, sources: null },
        published: { name: "Coffee shop", links: null, sources: null },
      };
      const first = publishShopLocation(shop, location()).location;
      const second = { ...first, id: "location-2" };

      expect(isShopVisible(shop, [unpublishLocation(first), second])).toBe(
        true,
      );
    });
  });

  it("keeps later shared edits private when publishing a location", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "New name", links: null, sources: null },
      published: { name: "Previous name", links: null, sources: null },
    };

    const result = publishShopLocation(shop, location());

    expect(result.shop.published).toEqual({
      name: "Previous name",
      links: null,
      sources: null,
    });
    expect(result.location.published).not.toBeNull();
  });

  it("rejects a location belonging to another shop", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop", links: null, sources: null },
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
      draft: { name: " ", links: null, sources: null },
      published: null,
    };
    const draftLocation = location();

    expect(() => publishShopLocation(shop, draftLocation)).toThrow(RangeError);
    expect(draftLocation.published).toBeNull();
    expect(shop.published).toBeNull();
  });
});
