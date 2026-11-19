import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { approveAccess } from "../src/domain/access";
import { handleShopDraftSave } from "../src/editor/shop-draft-handler";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { PersistenceError } from "../src/persistence/errors";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const verified: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

function post(body: string): Request {
  return new Request("https://admin.example.test/api/admin/shops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_editor", NOW));
  const repositories = createInMemoryRepositories();
  const newId = () => "shop-new";
  return {
    repositories,
    deps: { access, repositories, verifier: verified, newId },
  };
}

describe("shop draft endpoint", () => {
  it("saves a draft and returns a private no-store confirmation", async () => {
    const { repositories, deps } = await setup();

    const response = await handleShopDraftSave(
      deps,
      post(JSON.stringify({ name: "Bean There" })),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ok: true, id: "shop-new" });
    expect(await repositories.shops.get("shop-new")).not.toBeNull();
  });

  it("returns 422 with field errors for invalid input", async () => {
    const { deps } = await setup();

    const response = await handleShopDraftSave(
      deps,
      post(JSON.stringify({ name: " " })),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { name: "Shop name must not be blank." },
    });
  });

  it("returns 400 for a body that is not JSON", async () => {
    const { repositories, deps } = await setup();

    const response = await handleShopDraftSave(deps, post("{nope"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Submitted shop data is not valid." },
    });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("returns 401 for an unsigned request", async () => {
    const { repositories, deps } = await setup();

    const response = await handleShopDraftSave(
      { ...deps, verifier: { verify: async () => null } },
      post(JSON.stringify({ name: "X" })),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("returns 403 for a session without edit approval", async () => {
    const { repositories, deps } = await setup();

    const response = await handleShopDraftSave(
      { ...deps, access: createInMemoryAccessRepository() },
      post(JSON.stringify({ name: "X" })),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "no-access" });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("returns 503 without leaking persistence details", async () => {
    const { deps } = await setup();
    const failing = {
      ...deps.repositories,
      shops: {
        ...deps.repositories.shops,
        save: async () => {
          throw new PersistenceError("configuration", "MONGODB_URI secret");
        },
      },
    };

    const response = await handleShopDraftSave(
      { ...deps, repositories: failing },
      post(JSON.stringify({ name: "X" })),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
});
