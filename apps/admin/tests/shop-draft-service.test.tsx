import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { AuthorizationError } from "../src/authorization/service";
import { approveAccess, revokeAccess } from "../src/domain/access";
import { saveShopDraft } from "../src/editor/shop-draft-service";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";
import { photoObjectKey } from "../src/photos/storage";
import { MemoryPhotoStorage } from "../src/photos/storage-memory";

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
  const storage = new MemoryPhotoStorage();
  return {
    access,
    repositories,
    storage,
    deps: { access, repositories, storage, verifier, newId },
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

  describe("photos", () => {
    const bytes = new Uint8Array([1]);

    function variants(id: string, widths = [480, 960]) {
      return widths.map((width) => ({
        width,
        height: width / 2,
        key: photoObjectKey(id, width),
      }));
    }

    async function upload(
      storage: MemoryPhotoStorage,
      id: string,
      widths = [480, 960],
    ) {
      for (const width of widths) {
        await storage.put(photoObjectKey(id, width), bytes, "image/webp");
      }
      return variants(id, widths);
    }

    it("attaches an uploaded photo to the draft", async () => {
      const { repositories, storage, deps } = await setup();
      const uploaded = await upload(storage, "p1");

      const result = await saveShopDraft(deps, request, {
        name: "Bean",
        photos: [{ id: "p1", alt: "  Front counter  ", variants: uploaded }],
      });

      expect(result).toEqual({ ok: true, id: "shop-new" });
      expect((await repositories.shops.get("shop-new"))?.draft.photos).toEqual([
        { id: "p1", alt: "Front counter", variants: uploaded },
      ]);
    });

    it("stores an optional logo selected from the attached photos without changing the published logo", async () => {
      const { repositories, storage, deps } = await setup();
      const photo = {
        id: "p1",
        alt: "Counter",
        variants: await upload(storage, "p1"),
      };
      await repositories.shops.save({
        id: "shop-1",
        draft: { name: "Bean", links: null, sources: null, photos: [photo] },
        published: {
          name: "Bean",
          links: null,
          sources: null,
          photos: [photo],
        },
      });

      await expect(
        saveShopDraft(deps, request, {
          id: "shop-1",
          name: "Bean",
          logoPhotoId: "p1",
        }),
      ).resolves.toEqual({ ok: true, id: "shop-1" });
      const shop = await repositories.shops.get("shop-1");
      expect(shop?.draft.logoPhotoId).toBe("p1");
      expect(shop?.published?.logoPhotoId).toBeUndefined();
    });

    it("rejects a logo not in the attached photos and clears a removed logo", async () => {
      const { repositories, storage, deps } = await setup();
      const photo = {
        id: "p1",
        alt: "Counter",
        variants: await upload(storage, "p1"),
      };
      await repositories.shops.save({
        id: "shop-1",
        draft: {
          name: "Bean",
          links: null,
          sources: null,
          photos: [photo],
          logoPhotoId: "p1",
        },
        published: null,
      });

      await expect(
        saveShopDraft(deps, request, {
          id: "shop-1",
          name: "Bean",
          logoPhotoId: "other",
        }),
      ).resolves.toMatchObject({
        ok: false,
        errors: { logoPhotoId: expect.any(String) },
      });
      expect((await repositories.shops.get("shop-1"))?.draft.logoPhotoId).toBe(
        "p1",
      );

      await saveShopDraft(deps, request, {
        id: "shop-1",
        name: "Bean",
        photos: [],
      });
      expect(
        (await repositories.shops.get("shop-1"))?.draft.logoPhotoId,
      ).toBeUndefined();
    });

    it("rejects photos that were never uploaded without writing", async () => {
      const { repositories, storage, deps } = await setup();
      const uploaded = await upload(storage, "p1");
      await storage.delete(uploaded[1]?.key ?? "");

      await expect(
        saveShopDraft(deps, request, {
          name: "Bean",
          photos: [{ id: "p1", alt: "Counter", variants: uploaded }],
        }),
      ).resolves.toEqual({
        ok: false,
        errors: { photos: "Photos must be uploaded before they are attached." },
      });
      expect(await repositories.shops.list()).toEqual([]);
    });

    it("rejects invalid photo input without writing", async () => {
      const { repositories, storage, deps } = await setup();
      const uploaded = await upload(storage, "p1");
      const invalid = [
        "not-an-array",
        [null],
        [{ id: "p1", alt: "   ", variants: uploaded }],
        [{ id: "p1", alt: "Counter", variants: "nope" }],
        [{ id: "p1", alt: "Counter", variants: [null] }],
        [{ id: "p1", alt: "Counter", variants: [] }],
        [
          {
            id: "p1",
            alt: "Counter",
            variants: [{ ...uploaded[0], key: "photos/other/480.webp" }],
          },
        ],
        [{ id: "../x", alt: "Counter", variants: uploaded }],
        [
          { id: "p1", alt: "A", variants: uploaded },
          { id: "p1", alt: "B", variants: uploaded },
        ],
      ];

      for (const photos of invalid) {
        const result = await saveShopDraft(deps, request, {
          name: "Bean",
          photos,
        });
        expect(result.ok).toBe(false);
        expect(result).toMatchObject({
          errors: { photos: expect.any(String) },
        });
      }
      expect(await repositories.shops.list()).toEqual([]);
      expect(storage.keys()).toHaveLength(2);
    });

    it("keeps stored photos when the submission omits photos", async () => {
      const { repositories, storage, deps } = await setup();
      const photo = {
        id: "p1",
        alt: "Counter",
        variants: await upload(storage, "p1"),
      };
      await repositories.shops.save({
        id: "shop-1",
        draft: { name: "Bean", links: null, sources: null, photos: [photo] },
        published: null,
      });

      await saveShopDraft(deps, request, { id: "shop-1", name: "Bean 2" });

      expect((await repositories.shops.get("shop-1"))?.draft.photos).toEqual([
        photo,
      ]);
    });

    it("updates alt text but ignores client-supplied variants for stored photos", async () => {
      const { repositories, storage, deps } = await setup();
      const stored = await upload(storage, "p1");
      await repositories.shops.save({
        id: "shop-1",
        draft: {
          name: "Bean",
          links: null,
          sources: null,
          photos: [{ id: "p1", alt: "Old", variants: stored }],
        },
        published: null,
      });

      await saveShopDraft(deps, request, {
        id: "shop-1",
        name: "Bean",
        photos: [{ id: "p1", alt: "New", variants: [] }],
      });

      expect((await repositories.shops.get("shop-1"))?.draft.photos).toEqual([
        { id: "p1", alt: "New", variants: stored },
      ]);
    });

    it("deletes objects of removed photos that are not published", async () => {
      const { repositories, storage, deps } = await setup();
      const stored = await upload(storage, "p1");
      await upload(storage, "p2");
      await repositories.shops.save({
        id: "shop-1",
        draft: {
          name: "Bean",
          links: null,
          sources: null,
          photos: [{ id: "p1", alt: "One", variants: stored }],
        },
        published: null,
      });

      await saveShopDraft(deps, request, {
        id: "shop-1",
        name: "Bean",
        photos: [],
      });

      expect(
        (await repositories.shops.get("shop-1"))?.draft.photos,
      ).toBeUndefined();
      expect(storage.keys().sort()).toEqual([
        photoObjectKey("p2", 480),
        photoObjectKey("p2", 960),
      ]);
    });

    it("keeps objects of removed photos that are still published", async () => {
      const { repositories, storage, deps } = await setup();
      const photo = {
        id: "p1",
        alt: "One",
        variants: await upload(storage, "p1"),
      };
      const published = {
        name: "Bean",
        links: null,
        sources: null,
        photos: [photo],
      };
      await repositories.shops.save({
        id: "shop-1",
        draft: published,
        published,
      });

      await saveShopDraft(deps, request, {
        id: "shop-1",
        name: "Bean",
        photos: [],
      });

      expect(storage.keys()).toHaveLength(2);
    });
  });
});
