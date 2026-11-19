import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { approveAccess } from "../src/domain/access";
import { handleLocationDraftSave } from "../src/editor/location-draft-handler";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const verified: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

function post(body: string): Request {
  return new Request("https://admin.example.test/api/admin/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

const valid = JSON.stringify({
  shopId: "shop-1",
  type: "cafe",
  streetLine1: "",
  streetLine2: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  website: "",
});

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
    repositories,
    deps: {
      access,
      repositories,
      verifier: verified,
      newId: () => "loc-new",
      defaults: { regionId: "region", cityId: "city" },
    },
  };
}

describe("location draft endpoint", () => {
  it("saves a draft and returns a private no-store confirmation", async () => {
    const { repositories, deps } = await setup();

    const response = await handleLocationDraftSave(deps, post(valid));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ok: true, id: "loc-new" });
    expect(await repositories.locations.get("loc-new")).not.toBeNull();
  });

  it("returns 422 with field errors", async () => {
    const { deps } = await setup();

    const response = await handleLocationDraftSave(
      deps,
      post(JSON.stringify({ ...JSON.parse(valid), type: "kiosk" })),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { type: "Choose a valid location type." },
    });
  });

  it("returns 400 for a body that is not JSON", async () => {
    const { deps } = await setup();

    const response = await handleLocationDraftSave(deps, post("{nope"));

    expect(response.status).toBe(400);
  });

  it("returns 403 without approval and writes nothing", async () => {
    const { repositories, deps } = await setup();

    const response = await handleLocationDraftSave(
      { ...deps, access: createInMemoryAccessRepository() },
      post(valid),
    );

    expect(response.status).toBe(403);
    expect(await repositories.locations.listByShop("shop-1")).toEqual([]);
  });
});
