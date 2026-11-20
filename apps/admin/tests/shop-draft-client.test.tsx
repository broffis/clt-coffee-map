import { afterEach, describe, expect, it, vi } from "vitest";
import { saveShopDraftRequest } from "../src/editor/shop-draft-client";

const values = { name: "Bean There", website: "", photos: [] };

function respond(status: number, body: unknown) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json(body, { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saveShopDraftRequest", () => {
  it("posts JSON to the private endpoint with session cookies", async () => {
    const fetch = respond(200, { ok: true });

    await expect(saveShopDraftRequest(values)).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith("/api/admin/shops", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  });

  it.each([400, 422])(
    "returns server field errors for HTTP %s",
    async (status) => {
      respond(status, { ok: false, errors: { name: "Bad name." } });

      await expect(saveShopDraftRequest(values)).resolves.toEqual({
        ok: false,
        errors: { name: "Bad name." },
      });
    },
  );

  it.each([
    [401, /sign in again/i],
    [403, /not approved/i],
    [503, /unavailable/i],
    [500, /could not be saved/i],
  ])("explains HTTP %s without server details", async (status, text) => {
    respond(status, { error: "internal detail" });

    const outcome = await saveShopDraftRequest(values);

    expect(outcome).toEqual({
      ok: false,
      message: expect.stringMatching(text),
    });
    expect(JSON.stringify(outcome)).not.toContain("internal detail");
  });

  it("reports a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));

    await expect(saveShopDraftRequest(values)).resolves.toEqual({
      ok: false,
      message:
        "The draft could not be saved. Check your connection and try again.",
    });
  });

  it("treats a 422 with an unreadable body as a generic failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>", { status: 422 }),
    );

    await expect(saveShopDraftRequest(values)).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(/could not be saved/i),
    });
  });
});
