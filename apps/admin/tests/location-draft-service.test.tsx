import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { AuthorizationError } from "../src/authorization/service";
import { approveAccess, revokeAccess } from "../src/domain/access";
import type { LocationDetails } from "../src/domain/location";
import { saveLocationDraft } from "../src/editor/location-draft-service";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const request = new Request("https://admin.example.test/");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};
const input = {
  shopId: "shop-1",
  type: "cafe",
  streetLine1: "  1 Main St  ",
  streetLine2: "",
  postalCode: "28202",
  latitude: "35.2271",
  longitude: "-80.8431",
  website: "https://loc.example.test",
};

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_editor", NOW));
  const repositories = createInMemoryRepositories();
  await repositories.shops.save({
    id: "shop-1",
    draft: { name: "Bean There", links: null, sources: null },
    published: null,
  });
  return {
    access,
    repositories,
    deps: {
      access,
      repositories,
      verifier,
      newId: () => "loc-new",
      defaults: { regionId: "region-default", cityId: "city-default" },
    },
  };
}

describe("saveLocationDraft", () => {
  it("creates an unpublished draft with server-side region defaults", async () => {
    const { repositories, deps } = await setup();

    const result = await saveLocationDraft(deps, request, {
      ...input,
      id: "client-chosen",
    });

    expect(result).toEqual({
      ok: false,
      errors: { form: "Location not found." },
    });
    expect(await repositories.locations.listByShop("shop-1")).toEqual([]);

    const created = await saveLocationDraft(deps, request, input);

    expect(created).toEqual({ ok: true, id: "loc-new" });
    expect(await repositories.locations.get("loc-new")).toEqual({
      id: "loc-new",
      shopId: "shop-1",
      draft: {
        regionId: "region-default",
        cityId: "city-default",
        neighborhoodId: null,
        type: "cafe",
        coordinates: { latitude: 35.2271, longitude: -80.8431 },
        address: {
          streetLine1: "1 Main St",
          streetLine2: null,
          postalCode: "28202",
        },
        links: { website: "https://loc.example.test", other: [] },
        hoursInfoUrl: null,
        regularHours: null,
        roasters: null,
        coffeeOptions: null,
        nonCoffeeDrinks: null,
        food: null,
        sources: null,
      },
      published: null,
    });
  });

  it("allows a location without coordinates, address or website", async () => {
    const { repositories, deps } = await setup();

    await saveLocationDraft(deps, request, {
      shopId: "shop-1",
      type: "mobile coffee",
      streetLine1: "",
      streetLine2: "",
      postalCode: "",
      latitude: "",
      longitude: "",
      website: "",
    });

    const saved = await repositories.locations.get("loc-new");
    expect(saved?.draft).toMatchObject({
      type: "mobile coffee",
      coordinates: null,
      address: null,
      links: null,
    });
  });

  it.each([
    [{ shopId: "ghost" }, { shopId: "Choose an existing shop." }],
    [{ type: "kiosk" }, { type: "Choose a valid location type." }],
    [{ longitude: "" }, { longitude: "Enter both latitude and longitude." }],
    [{ latitude: "" }, { latitude: "Enter both latitude and longitude." }],
    [{ latitude: "91" }, { latitude: "Latitude must be between -90 and 90." }],
    [{ latitude: "abc" }, { latitude: "Latitude must be between -90 and 90." }],
    [
      { longitude: "181" },
      { longitude: "Longitude must be between -180 and 180." },
    ],
    [
      { website: "http://insecure.example.test" },
      { website: "Website URL must be a valid HTTPS URL." },
    ],
  ])(
    "returns field errors and writes nothing for %j",
    async (change, errors) => {
      const { repositories, deps } = await setup();

      const result = await saveLocationDraft(deps, request, {
        ...input,
        ...change,
      });

      expect(result).toEqual({ ok: false, errors });
      expect(await repositories.locations.listByShop("shop-1")).toEqual([]);
    },
  );

  it("rejects non-object input", async () => {
    const { deps } = await setup();

    await expect(saveLocationDraft(deps, request, null)).resolves.toEqual({
      ok: false,
      errors: { form: "Submitted location data is not valid." },
    });
  });

  it("edits only the submitted fields and preserves the rest, including published", async () => {
    const { repositories, deps } = await setup();
    const details: LocationDetails = {
      regionId: "region-x",
      cityId: "city-x",
      neighborhoodId: "hood-1",
      type: "bakery",
      coordinates: null,
      address: null,
      links: null,
      hoursInfoUrl: "https://hours.example.test",
      regularHours: null,
      roasters: ["Roaster A"],
      coffeeOptions: ["drip"],
      nonCoffeeDrinks: true,
      food: null,
      sources: null,
    };
    await repositories.locations.save({
      id: "loc-1",
      shopId: "shop-1",
      draft: details,
      published: { ...details, type: "cafe" },
    });

    const result = await saveLocationDraft(deps, request, {
      ...input,
      id: "loc-1",
      type: "coffee roaster",
    });

    expect(result).toEqual({ ok: true, id: "loc-1" });
    const saved = await repositories.locations.get("loc-1");
    expect(saved?.draft).toMatchObject({
      regionId: "region-x",
      cityId: "city-x",
      neighborhoodId: "hood-1",
      type: "coffee roaster",
      hoursInfoUrl: "https://hours.example.test",
      roasters: ["Roaster A"],
    });
    expect(saved?.published).toEqual({ ...details, type: "cafe" });
  });

  it("does not move a location to another shop", async () => {
    const { repositories, deps } = await setup();
    await repositories.shops.save({
      id: "shop-2",
      draft: { name: "Other", links: null, sources: null },
      published: null,
    });
    await saveLocationDraft(deps, request, input);

    const result = await saveLocationDraft(deps, request, {
      ...input,
      id: "loc-new",
      shopId: "shop-2",
    });

    expect(result).toEqual({
      ok: false,
      errors: { form: "Location not found." },
    });
  });

  it("denies a revoked session before touching data", async () => {
    const { access, repositories, deps } = await setup();
    const editor = await access.get("user_editor");
    if (editor === null) {
      throw new Error("Expected the editor record.");
    }
    await access.save(revokeAccess(editor, NOW));

    await expect(saveLocationDraft(deps, request, input)).rejects.toEqual(
      new AuthorizationError("revoked"),
    );
    expect(await repositories.locations.listByShop("shop-1")).toEqual([]);
  });
});
