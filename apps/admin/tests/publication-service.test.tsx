import { describe, expect, it, vi } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { AuthorizationError } from "../src/authorization/service";
import { approveAccess, revokeAccess } from "../src/domain/access";
import type { ShopLocation } from "../src/domain/location";
import type { Shop } from "../src/domain/shop";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";
import { updatePublication } from "../src/publication/publication-service";

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
  return {
    access,
    repositories,
    deps: { access, repositories, verifier },
  };
}

describe("updatePublication", () => {
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
