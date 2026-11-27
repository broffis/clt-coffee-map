import { describe, expect, it } from "vitest";
import { exportPublishedShop } from "../src/domain/export";
import type { ShopLocation } from "../src/domain/location";
import { type ShopPhoto, validateShopPhotos } from "../src/domain/photo";
import { publishShopDetails, type Shop } from "../src/domain/shop";

function photo(overrides: Partial<ShopPhoto> = {}): ShopPhoto {
  return {
    id: "photo-1",
    alt: "Espresso bar with pastries",
    variants: [
      { width: 480, height: 320, key: "photos/photo-1/480.webp" },
      { width: 960, height: 640, key: "photos/photo-1/960.webp" },
    ],
    ...overrides,
  };
}

function shopWith(photos?: readonly ShopPhoto[]): Shop {
  return {
    id: "shop-1",
    draft: {
      name: "Coffee shop",
      links: null,
      sources: null,
      ...(photos === undefined ? {} : { photos }),
    },
    published: null,
  };
}

describe("validateShopPhotos", () => {
  it("accepts well-formed photos", () => {
    expect(() => validateShopPhotos([photo()])).not.toThrow();
  });

  it("rejects blank alternative text", () => {
    expect(() => validateShopPhotos([photo({ alt: "  " })])).toThrow(
      "Photo alternative text must not be blank.",
    );
  });

  it("rejects unsafe or duplicate photo IDs", () => {
    expect(() => validateShopPhotos([photo({ id: "../x" })])).toThrow(
      RangeError,
    );
    expect(() => validateShopPhotos([photo(), photo()])).toThrow(
      "Photo IDs must not contain duplicates.",
    );
  });

  it("requires at least one variant", () => {
    expect(() => validateShopPhotos([photo({ variants: [] })])).toThrow(
      "Each photo needs at least one variant.",
    );
  });

  it("rejects invalid or duplicate variant sizes", () => {
    const bad = (width: number, height: number) =>
      photo({
        variants: [{ width, height, key: `photos/photo-1/${width}.webp` }],
      });
    expect(() => validateShopPhotos([bad(0, 10)])).toThrow(
      "Photo variant dimensions must be positive whole numbers.",
    );
    expect(() => validateShopPhotos([bad(10, 1.5)])).toThrow(RangeError);
    const [variant] = photo().variants;
    expect(() =>
      validateShopPhotos([
        photo({ variants: [variant as never, variant as never] }),
      ]),
    ).toThrow("Photo variant widths must be unique.");
  });

  it("rejects keys that do not match the photo and width", () => {
    expect(() =>
      validateShopPhotos([
        photo({
          variants: [{ width: 480, height: 320, key: "photos/other/480.webp" }],
        }),
      ]),
    ).toThrow("Photo variant key must match its photo and width.");
  });
});

describe("shop photos", () => {
  it("publishes a valid logo selection and rejects a missing photo", () => {
    const shop = shopWith([photo()]);
    expect(
      publishShopDetails({
        ...shop,
        draft: { ...shop.draft, logoPhotoId: "photo-1" },
      }).published?.logoPhotoId,
    ).toBe("photo-1");
    expect(() =>
      publishShopDetails({
        ...shop,
        draft: { ...shop.draft, logoPhotoId: "missing" },
      }),
    ).toThrow("Choose a logo from the attached photos.");
  });

  it("publishes a copy of validated photos", () => {
    const original = photo();
    const result = publishShopDetails(shopWith([original]));

    expect(result.published?.photos).toEqual([original]);
    expect(result.published?.photos?.[0]).not.toBe(original);
    expect(result.published?.photos?.[0]?.variants[0]).not.toBe(
      original.variants[0],
    );
  });

  it("omits photos when none exist", () => {
    expect(publishShopDetails(shopWith()).published).not.toHaveProperty(
      "photos",
    );
  });

  it("blocks publication when a photo is invalid", () => {
    expect(() => publishShopDetails(shopWith([photo({ alt: "" })]))).toThrow(
      "Photo alternative text must not be blank.",
    );
  });

  it("exports only published photos", () => {
    const published = publishShopDetails(shopWith([photo()]));
    const location: ShopLocation = {
      id: "loc-1",
      shopId: "shop-1",
      draft: {} as never,
      published: {
        regionId: "r",
        cityId: "c",
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
        sources: null,
      },
    };

    expect(exportPublishedShop(published, [location])?.details.photos).toEqual([
      photo(),
    ]);
    const withDraftOnly: Shop = {
      ...published,
      draft: { ...published.draft, photos: [photo({ id: "draft-only" })] },
    };
    expect(
      exportPublishedShop(withDraftOnly, [location])?.details.photos,
    ).toEqual([photo()]);
  });
});
