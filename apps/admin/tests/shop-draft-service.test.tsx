import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { AuthorizationError } from "../src/authorization/service";
import { approveAccess, revokeAccess } from "../src/domain/access";
import { saveShopDraft } from "../src/editor/shop-draft-service";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const request = new Request("https://admin.example.test/");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_editor", NOW));
  const repositories = createInMemoryRepositories();
  const newId = () => "shop-new";
  return {
    access,
    repositories,
    deps: { access, repositories, verifier, newId },
  };
}

describe("saveShopDraft", () => {
  it("creates an unpublished draft under a server-generated ID", async () => {
    const { repositories, deps } = await setup();

    const result = await saveShopDraft(deps, request, {
      name: "  Bean There  ",
      website: "https://bean.example.test",
    });

    expect(result).toEqual({ ok: true, id: "shop-new" });
    expect(await repositories.shops.get("shop-new")).toEqual({
      id: "shop-new",
      draft: {
        name: "Bean There",
        links: { website: "https://bean.example.test", other: [] },
        sources: null,
      },
      published: null,
    });
  });

  it("returns field errors and writes nothing for invalid input", async () => {
    const { repositories, deps } = await setup();

    const result = await saveShopDraft(deps, request, {
      name: "   ",
      website: "http://insecure.example.test",
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Shop name must not be blank.",
        website: "Website URL must be a valid HTTPS URL.",
      },
    });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("rejects non-object input without writing", async () => {
    const { repositories, deps } = await setup();

    await expect(saveShopDraft(deps, request, null)).resolves.toEqual({
      ok: false,
      errors: { form: "Submitted shop data is not valid." },
    });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("edits the draft without changing published content", async () => {
    const { repositories, deps } = await setup();
    const published = {
      name: "Published Name",
      links: null,
      sources: null,
    };
    await repositories.shops.save({
      id: "shop-1",
      draft: { ...published, name: "Old Draft" },
      published,
    });

    const result = await saveShopDraft(deps, request, {
      id: "shop-1",
      name: "New Draft",
    });

    expect(result).toEqual({ ok: true, id: "shop-1" });
    expect(await repositories.shops.get("shop-1")).toEqual({
      id: "shop-1",
      draft: { name: "New Draft", links: null, sources: null },
      published,
    });
  });

  it("rejects editing an unknown shop without creating it", async () => {
    const { repositories, deps } = await setup();

    await expect(
      saveShopDraft(deps, request, { id: "ghost", name: "Ghost" }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Shop not found." },
    });
    expect(await repositories.shops.list()).toEqual([]);
  });

  it("denies an unapproved or revoked session without writing", async () => {
    const { access, repositories, deps } = await setup();
    const editor = await access.get("user_editor");
    if (editor === null) {
      throw new Error("Expected the editor record.");
    }
    await access.save(revokeAccess(editor, NOW));

    await expect(
      saveShopDraft(deps, request, { name: "Nope" }),
    ).rejects.toEqual(new AuthorizationError("revoked"));
    expect(await repositories.shops.list()).toEqual([]);
  });
});
