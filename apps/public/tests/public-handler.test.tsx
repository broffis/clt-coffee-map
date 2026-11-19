import { describe, expect, it } from "vitest";
import { handlePublicShops } from "../src/public-data/public-handler";
import { PublicReadError } from "../src/public-data/public-reader";

describe("handlePublicShops", () => {
  it("returns public data with cache headers", async () => {
    const response = await handlePublicShops({
      reader: {
        get: async () => null,
        list: async () => [
          {
            id: "shop-1",
            details: { name: "Shop" },
            locations: [],
          },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("public");
    await expect(response.json()).resolves.toEqual({
      shops: [{ id: "shop-1", details: { name: "Shop" }, locations: [] }],
    });
  });

  it("returns an explicit unavailable response without caching failures", async () => {
    const response = await handlePublicShops({
      reader: {
        get: async () => null,
        list: async () => {
          throw new PublicReadError();
        },
      },
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "unavailable" });
  });

  it("rethrows unexpected reader errors", async () => {
    await expect(
      handlePublicShops({
        reader: {
          get: async () => null,
          list: async () => {
            throw new Error("unexpected");
          },
        },
      }),
    ).rejects.toThrow("unexpected");
  });
});
