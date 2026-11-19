import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEditorRecordsRequest } from "../src/editor/editor-records-client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadEditorRecordsRequest", () => {
  it("fetches private records without caching", async () => {
    const records = { shops: [] };
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(records));

    await expect(loadEditorRecordsRequest()).resolves.toEqual({
      ok: true,
      records,
    });
    expect(fetch).toHaveBeenCalledWith("/api/admin/shops", {
      cache: "no-store",
      credentials: "same-origin",
    });
  });

  it.each([
    [403, /not approved/i],
    [401, /sign in again/i],
    [500, /could not be loaded/i],
  ])("explains HTTP %s without details", async (status, text) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "detail" }, { status }),
    );
    const outcome = await loadEditorRecordsRequest();
    expect(outcome).toEqual({
      ok: false,
      message: expect.stringMatching(text),
    });
  });

  it("rejects malformed bodies and network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ nope: true }),
    );
    await expect(loadEditorRecordsRequest()).resolves.toMatchObject({
      ok: false,
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("x"));
    await expect(loadEditorRecordsRequest()).resolves.toMatchObject({
      ok: false,
      message: expect.stringMatching(/connection/i),
    });
  });
});
