import { afterEach, describe, expect, it, vi } from "vitest";
import { saveLocationDraftRequest } from "../src/editor/location-draft-client";
import { saveShopDraftRequest } from "../src/editor/shop-draft-client";

const values = {
  shopId: "shop-1",
  type: "cafe",
  streetLine1: "1 Main St",
  streetLine2: "",
  postalCode: "28202",
  latitude: "35.2",
  longitude: "-80.8",
  website: "",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveLocationDraftRequest", () => {
  it("posts to the locations endpoint and returns the generated id", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true, id: "loc-9" }));

    await expect(saveLocationDraftRequest(values)).resolves.toEqual({
      ok: true,
      id: "loc-9",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/locations",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify(values),
      }),
    );
  });

  it("returns server field errors and hides other failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ errors: { latitude: "Bad." } }, { status: 422 }),
    );
    await expect(saveLocationDraftRequest(values)).resolves.toEqual({
      ok: false,
      errors: { latitude: "Bad." },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ error: "secret" }, { status: 503 }),
    );
    await expect(saveLocationDraftRequest(values)).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(/unavailable/i),
    });
  });
});

describe("saveShopDraftRequest id handling", () => {
  it("returns the id from the server and sends an existing id on edit", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true, id: "shop-1" }));

    await expect(
      saveShopDraftRequest({ id: "shop-1", name: "Bean", website: "" }),
    ).resolves.toEqual({ ok: true, id: "shop-1" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/shops",
      expect.objectContaining({
        body: JSON.stringify({ id: "shop-1", name: "Bean", website: "" }),
      }),
    );
  });
});
