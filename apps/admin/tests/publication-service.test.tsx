import { describe, expect, it, vi } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { AuthorizationError } from "../src/authorization/service";
import { approveAccess, revokeAccess } from "../src/domain/access";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";
import { updatePublication } from "../src/publication/publication-service";
import { handlePublicationUpdate } from "../src/publication/publication-handler";

const NOW = new Date("2026-11-19T15:00:00.000Z");
const request = new Request("https://admin.example.test/");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_owner" }),
};

const shop: Shop = {
  id: "shop-1",
  draft: { name: "Draft name", links: null, sources: null },
  published: null,
};

const location: ShopLocation = {
  id: "location-1",
  shopId: "shop-1",
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

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_owner", NOW));
  const repositories = createInMemoryRepositories();
  await repositories.shops.save(shop);
  await repositories.locations.save(location);
  const photoDelivery = { copy: vi.fn().mockResolvedValue(undefined) };
  return {
    access,
    repositories,
    photoDelivery,
    deps: { access, repositories, verifier, photoDelivery },
  };
}

describe("updatePublication", () => {
  it("copies photos only after the shop and location are published", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    const photo = {
      id: "p1",
      alt: "Counter",
      variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
    };
    await repositories.shops.save({
      ...shop,
      draft: { ...shop.draft, photos: [photo] },
    });
    photoDelivery.copy.mockImplementation(async () => {
      expect(
        (await repositories.shops.get(shop.id))?.published?.photos,
      ).toEqual([photo]);
      expect(
        (await repositories.locations.get(location.id))?.published,
      ).not.toBeNull();
    });

    await updatePublication(deps, request, {
      action: "publish-location",
      shopId: shop.id,
      locationId: location.id,
    });

    expect(photoDelivery.copy).toHaveBeenCalledWith("photos/p1/480.webp");
  });

  it("leaves publication saved and retries copying after a delivery failure", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    await repositories.shops.save({
      ...shop,
      draft: {
        ...shop.draft,
        photos: [
          {
            id: "p1",
            alt: "Counter",
            variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
          },
        ],
      },
    });
    photoDelivery.copy.mockRejectedValueOnce(new Error("delivery unavailable"));
    const input = {
      action: "publish-location",
      shopId: shop.id,
      locationId: location.id,
    };

    await expect(updatePublication(deps, request, input)).rejects.toThrow();
    expect(
      (await repositories.locations.get(location.id))?.published,
    ).not.toBeNull();
    await expect(
      updatePublication(deps, request, input),
    ).resolves.toMatchObject({
      ok: true,
    });
    expect(photoDelivery.copy).toHaveBeenCalledTimes(2);
  });

  it("does not copy a draft if saving its location fails", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    await repositories.shops.save({
      ...shop,
      draft: {
        ...shop.draft,
        photos: [
          {
            id: "p1",
            alt: "Counter",
            variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
          },
        ],
      },
    });
    vi.spyOn(repositories.locations, "save").mockRejectedValueOnce(
      new Error("storage unavailable"),
    );

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: shop.id,
        locationId: location.id,
      }),
    ).rejects.toThrow("storage unavailable");
    expect(photoDelivery.copy).not.toHaveBeenCalled();
  });

  it("does not copy photos when republishing a shop with no published locations", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    await repositories.shops.save({
      ...shop,
      draft: {
        ...shop.draft,
        photos: [
          {
            id: "p1",
            alt: "Counter",
            variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
          },
        ],
      },
      published: shop.draft,
    });

    await updatePublication(deps, request, {
      action: "republish-shop",
      shopId: shop.id,
    });
    expect(photoDelivery.copy).not.toHaveBeenCalled();
  });

  it("returns a specific retryable response for photo delivery failures", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    await repositories.shops.save({
      ...shop,
      draft: {
        ...shop.draft,
        photos: [
          {
            id: "p1",
            alt: "Counter",
            variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
          },
        ],
      },
    });
    photoDelivery.copy.mockRejectedValue(new Error("provider details"));
    const response = await handlePublicationUpdate(
      deps,
      new Request("https://admin.example.test/api/admin/publication", {
        method: "POST",
        body: JSON.stringify({
          action: "publish-location",
          shopId: shop.id,
          locationId: location.id,
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "photo-delivery-pending" });
  });

  it("retries delivery of published photos without publishing newer drafts", async () => {
    const { repositories, deps, photoDelivery } = await setup();
    const photo = {
      id: "p1",
      alt: "Counter",
      variants: [{ width: 480, height: 320, key: "photos/p1/480.webp" }],
    };
    await repositories.shops.save({
      ...shop,
      published: { ...shop.draft, photos: [photo] },
      draft: { ...shop.draft, name: "Unpublished edit" },
    });
    await repositories.locations.save({
      ...location,
      published: location.draft,
    });

    await expect(
      updatePublication(deps, request, {
        action: "retry-photo-delivery",
        shopId: shop.id,
      }),
    ).resolves.toMatchObject({ ok: true });

    expect(photoDelivery.copy).toHaveBeenCalledWith("photos/p1/480.webp");
    expect((await repositories.shops.get(shop.id))?.published?.name).toBe(
      "Draft name",
    );
  });

  it("rejects non-object publication data", async () => {
    const { deps } = await setup();

    await expect(updatePublication(deps, request, null)).resolves.toEqual({
      ok: false,
      errors: { form: "Submitted publication data is not valid." },
    });
  });

  it("publishes a location and the shared shop details on first publication", async () => {
    const { repositories, deps } = await setup();

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).resolves.toEqual({
      ok: true,
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });

    expect((await repositories.shops.get("shop-1"))?.published?.name).toBe(
      "Draft name",
    );
    expect((await repositories.locations.get("location-1"))?.published).toEqual(
      location.draft,
    );
  });

  it("unpublishes only the location and retains its draft", async () => {
    const { repositories, deps } = await setup();
    await updatePublication(deps, request, {
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });

    await expect(
      updatePublication(deps, request, {
        action: "unpublish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).resolves.toMatchObject({ ok: true, action: "unpublish-location" });

    const saved = await repositories.locations.get("location-1");
    expect(saved?.draft).toEqual(location.draft);
    expect(saved?.published).toBeNull();
    expect((await repositories.shops.get("shop-1"))?.published).not.toBeNull();
  });

  it("returns domain validation errors while republishing", async () => {
    const { repositories, deps } = await setup();
    await updatePublication(deps, request, {
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });
    const publishedShop = await repositories.shops.get("shop-1");
    if (publishedShop === null) {
      throw new Error("Expected the shop to exist.");
    }
    await repositories.shops.save({
      ...publishedShop,
      draft: { ...publishedShop.draft, name: "" },
    });

    await expect(
      updatePublication(deps, request, {
        action: "republish-shop",
        shopId: "shop-1",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop name must not be blank." },
    });
  });

  it("triggers public regeneration after saving a publication", async () => {
    const trigger = { trigger: vi.fn().mockResolvedValue(undefined) };
    const { deps } = await setup();

    await updatePublication({ ...deps, publicRegeneration: trigger }, request, {
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });

    expect(trigger.trigger).toHaveBeenCalledWith({
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });
  });

  it("republishes shared shop details without changing locations", async () => {
    const { repositories, deps } = await setup();
    await updatePublication(deps, request, {
      action: "publish-location",
      shopId: "shop-1",
      locationId: "location-1",
    });

    const publishedShop = await repositories.shops.get("shop-1");
    if (publishedShop === null) {
      throw new Error("Expected the shop to exist.");
    }
    await repositories.shops.save({
      ...publishedShop,
      draft: { name: "Updated name", links: null, sources: null },
    });

    await expect(
      updatePublication(deps, request, {
        action: "republish-shop",
        shopId: "shop-1",
      }),
    ).resolves.toEqual({
      ok: true,
      action: "republish-shop",
      shopId: "shop-1",
    });

    expect((await repositories.shops.get("shop-1"))?.published?.name).toBe(
      "Updated name",
    );
    expect((await repositories.locations.get("location-1"))?.published).toEqual(
      location.draft,
    );
  });

  it("returns validation errors without reading or writing records", async () => {
    const { repositories, deps } = await setup();

    await expect(updatePublication(deps, request, {})).resolves.toEqual({
      ok: false,
      errors: {
        shopId: "Choose a shop.",
        locationId: "Choose a location.",
        action: "Choose a valid publication action.",
      },
    });
    expect(await repositories.shops.get("shop-1")).toEqual(shop);
    expect(await repositories.locations.get("location-1")).toEqual(location);
  });

  it("rejects republishing a shop that has never been published", async () => {
    const { deps } = await setup();

    await expect(
      updatePublication(deps, request, {
        action: "republish-shop",
        shopId: "shop-1",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: {
        form: "Publish a location before republishing shop details.",
      },
    });
  });

  it("returns domain validation errors while publishing", async () => {
    const { deps } = await setup();

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).resolves.toMatchObject({ ok: true });

    const repositories = deps.repositories;
    const savedShop = await repositories.shops.get("shop-1");
    if (savedShop === null) {
      throw new Error("Expected the shop to exist.");
    }
    await repositories.shops.save({
      ...savedShop,
      draft: { ...savedShop.draft, name: "" },
      published: null,
    });

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop name must not be blank." },
    });
  });

  it("reports missing shops and locations", async () => {
    const { deps } = await setup();

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "missing",
        locationId: "location-1",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop or location not found." },
    });

    await expect(
      updatePublication(deps, request, {
        action: "unpublish-location",
        shopId: "shop-1",
        locationId: "missing",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop or location not found." },
    });
  });

  it("rejects a location belonging to another shop", async () => {
    const { repositories, deps } = await setup();
    await repositories.shops.save({ ...shop, id: "shop-2" });
    await repositories.locations.save({
      ...location,
      id: "location-2",
      shopId: "shop-2",
    });

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-2",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop or location not found." },
    });
  });

  it("denies users without current publish permission", async () => {
    const { access, repositories, deps } = await setup();
    const owner = await access.get("user_owner");
    if (owner === null) {
      throw new Error("Expected the owner record.");
    }
    await access.save(revokeAccess(owner, NOW));

    await expect(
      updatePublication(deps, request, {
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toEqual(new AuthorizationError("revoked"));
    expect((await repositories.shops.get("shop-1"))?.published).toBeNull();
  });
});
