import { afterEach, describe, expect, it, vi } from "vitest";
import { updateLocationPublication } from "../src/editor/publication-client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateLocationPublication", () => {
  it("posts the requested publication action", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true }));

    await expect(
      updateLocationPublication("shop-1", "location-1", "publish-location"),
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/publication",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          shopId: "shop-1",
          locationId: "location-1",
          action: "publish-location",
        }),
      }),
    );
  });

  it("omits a location id when republishing shop details", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ok: true }));

    await expect(
      updateLocationPublication("shop-1", undefined, "republish-shop"),
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/publication",
      expect.objectContaining({
        body: JSON.stringify({
          shopId: "shop-1",
          action: "republish-shop",
        }),
      }),
    );
  });

  it.each([
    [401, /sign in again/i],
    [403, /not approved/i],
    [422, /could not be published/i],
    [503, /try again later/i],
  ])("maps status %s to a safe message", async (status, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status }),
    );

    await expect(
      updateLocationPublication("shop-1", "location-1", "unpublish-location"),
    ).resolves.toEqual({ ok: false, message: expect.stringMatching(message) });
  });
});
