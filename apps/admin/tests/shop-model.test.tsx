import { describe, expect, it } from "vitest";
import { publishShopDetails, type Shop } from "../src/domain/shop";

describe("shop details", () => {
  it("creates the first published snapshot from the draft", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop", links: null, sources: null },
      published: null,
    };

    expect(publishShopDetails(shop).published).toEqual({
      name: "Coffee shop",
      links: null,
      sources: null,
    });
    expect(shop.published).toBeNull();
  });

  it("publishes a snapshot without changing the draft", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "New name", links: null, sources: null },
      published: { name: "Old name", links: null, sources: null },
    };

    const result = publishShopDetails(shop);

    expect(result.published).toEqual({
      name: "New name",
      links: null,
      sources: null,
    });
    expect(result.published).not.toBe(shop.draft);
    expect(shop.published).toEqual({
      name: "Old name",
      links: null,
      sources: null,
    });
  });

  it("keeps shared links in the published snapshot separate from the draft", () => {
    const social = { label: "Instagram", url: "https://example.com/old" };
    const links = { website: "https://example.com", other: [social] };
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "Coffee shop", links, sources: null },
      published: null,
    };

    const result = publishShopDetails(shop);
    social.url = "https://example.com/new";
    links.other.push({ label: "Menu", url: "https://example.com/menu" });

    expect(result.published?.links).toEqual({
      website: "https://example.com",
      other: [{ label: "Instagram", url: "https://example.com/old" }],
    });
  });

  it("rejects a blank name without changing the published details", () => {
    const shop: Shop = {
      id: "shop-1",
      draft: { name: "  ", links: null, sources: null },
      published: { name: "Existing name", links: null, sources: null },
    };

    expect(() => publishShopDetails(shop)).toThrow(RangeError);
    expect(shop.published).toEqual({
      name: "Existing name",
      links: null,
      sources: null,
    });
  });

  it("rejects a shop without an identity", () => {
    const shop: Shop = {
      id: " ",
      draft: { name: "Coffee shop", links: null, sources: null },
      published: null,
    };

    expect(() => publishShopDetails(shop)).toThrow(RangeError);
  });
});
