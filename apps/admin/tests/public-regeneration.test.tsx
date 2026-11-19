import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPublicRegenerationTrigger,
  PublicRegenerationError,
} from "../src/publication/public-regeneration";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createPublicRegenerationTrigger", () => {
  it("posts a publication event to the configured HTTPS hook", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }));

    await createPublicRegenerationTrigger({
      PUBLIC_REGENERATION_WEBHOOK_URL: "https://deploy.example.test/hook",
      PUBLIC_REGENERATION_WEBHOOK_SECRET: "secret",
    }).trigger({
      action: "republish-shop",
      shopId: "shop-1",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]?.toString()).toBe(
      "https://deploy.example.test/hook",
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Public-Regeneration-Secret": "secret",
      },
      body: JSON.stringify({ action: "republish-shop", shopId: "shop-1" }),
    });
  });

  it("rejects missing, non-HTTPS, and failed hooks", async () => {
    await expect(
      createPublicRegenerationTrigger({}).trigger({
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(PublicRegenerationError);

    await expect(
      createPublicRegenerationTrigger({
        PUBLIC_REGENERATION_WEBHOOK_URL: "http://deploy.example.test/hook",
      }).trigger({
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(PublicRegenerationError);

    await expect(
      createPublicRegenerationTrigger({
        PUBLIC_REGENERATION_WEBHOOK_URL: "not-a-url",
      }).trigger({
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(PublicRegenerationError);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    await expect(
      createPublicRegenerationTrigger({
        PUBLIC_REGENERATION_WEBHOOK_URL: "https://deploy.example.test/hook",
      }).trigger({
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(PublicRegenerationError);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    await expect(
      createPublicRegenerationTrigger({
        PUBLIC_REGENERATION_WEBHOOK_URL: "https://deploy.example.test/hook",
      }).trigger({
        action: "publish-location",
        shopId: "shop-1",
        locationId: "location-1",
      }),
    ).rejects.toBeInstanceOf(PublicRegenerationError);
  });
});
