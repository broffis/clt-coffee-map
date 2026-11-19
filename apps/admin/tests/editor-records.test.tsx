import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { approveAccess } from "../src/domain/access";
import { handleEditorRecords } from "../src/editor/editor-records";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { PersistenceError } from "../src/persistence/errors";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const request = new Request("https://admin.example.test/api/admin/shops");
const verified: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

const details = {
  regionId: "region",
  cityId: "city",
  neighborhoodId: null,
  type: "cafe" as const,
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
  await repositories.locations.save({
    id: "loc-1",
    shopId: "shop-1",
    draft: details,
    published: null,
  });
  return { repositories, deps: { access, repositories, verifier: verified } };
}

describe("editor records endpoint", () => {
  it("returns draft shops with their locations, privately", async () => {
    const { deps } = await setup();

    const response = await handleEditorRecords(deps, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      shops: [
        {
          id: "shop-1",
          name: "Bean There",
          website: "",
          locations: [
            {
              id: "loc-1",
              type: "cafe",
              streetLine1: "",
              streetLine2: "",
              postalCode: "",
              latitude: "",
              longitude: "",
              website: "",
            },
          ],
        },
      ],
    });
  });

  it("returns 401 for an unsigned request", async () => {
    const { deps } = await setup();

    const response = await handleEditorRecords(
      { ...deps, verifier: { verify: async () => null } },
      request,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("returns 403 without approval", async () => {
    const { deps } = await setup();

    const response = await handleEditorRecords(
      { ...deps, access: createInMemoryAccessRepository() },
      request,
    );

    expect(response.status).toBe(403);
  });

  it("returns 503 without leaking persistence details", async () => {
    const { deps } = await setup();
    const failing = {
      ...deps.repositories,
      shops: {
        ...deps.repositories.shops,
        list: async () => {
          throw new PersistenceError("configuration", "MONGODB_URI secret");
        },
      },
    };

    const response = await handleEditorRecords(
      { ...deps, repositories: failing },
      request,
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
});
