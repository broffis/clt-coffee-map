import { describe, expect, it } from "vitest";
import { publishShopDetails, type Shop } from "../src/domain/shop";

describe("shop details", () => {
  it("creates the first published snapshot from the draft", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop" },
      published: null,
    };

    expect(publishShopDetails(shop).published).toEqual({ name: "Coffee shop" });
    expect(shop.published).toBeNull();
  });

  it("publishes a snapshot without changing the draft", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "New name" },
      published: { name: "Old name" },
    };

    const result = publishShopDetails(shop);

    expect(result.published).toEqual({ name: "New name" });
    expect(result.published).not.toBe(shop.draft);
    expect(shop.published).toEqual({ name: "Old name" });
  });

  it("rejects a blank name without changing the published details", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "  " },
      published: { name: "Existing name" },
    };

    expect(() => publishShopDetails(shop)).toThrow(RangeError);
    expect(shop.published).toEqual({ name: "Existing name" });
  });
});
