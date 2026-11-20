import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Directory } from "../src/routes/index";
import { ShopDetailContent } from "../src/routes/shops/$shopId";

// Keep production navigation on Link; this isolated test has no RouterProvider.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
    }: {
      to: string;
      params?: Record<string, string>;
      children: ReactNode;
    }) => {
      const href = Object.entries(params ?? {}).reduce(
        (path, [key, value]) => path.replace(`$${key}`, value),
        to,
      );
      return <a href={href}>{children}</a>;
    },
  };
});

describe("public application scaffold", () => {
  it("provides an account-free unavailable state", () => {
    render(<Directory data={{ ok: false, error: "unavailable" }} />, {
      container: document,
    });

    expect(
      screen.getByRole("heading", { name: "CLT Coffee Map" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      /directory is temporarily unavailable/i,
    );
    expect(
      screen.queryByRole("button", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty directory", () => {
    render(<Directory data={{ ok: true, shops: [] }} />, {
      container: document,
    });

    expect(screen.getByText(/No published coffee shops/)).toBeVisible();
  });

  it("renders published shops from the public projection", () => {
    render(
      <Directory
        data={{
          ok: true,
          shops: [
            {
              id: "shop-1",
              details: { name: "Published shop" },
              locations: [{ id: "location-1", shopId: "shop-1", details: {} }],
            },
          ],
        }}
      />,
      { container: document },
    );

    expect(screen.getByText("Published shop")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Published shop" }),
    ).toHaveAttribute("href", "/shops/shop-1");
    expect(screen.getByText("(1 location)")).toBeVisible();
  });

  it("renders a published shop detail page", () => {
    render(
      <ShopDetailContent
        data={{
          ok: true,
          shop: {
            id: "shop-1",
            details: { name: "Published shop" },
            locations: [
              {
                id: "location-1",
                shopId: "shop-1",
                details: { type: "cafe", cityId: "charlotte" },
              },
            ],
          },
        }}
      />,
      { container: document },
    );

    expect(
      screen.getByRole("heading", { name: "Published shop" }),
    ).toBeVisible();
    expect(screen.getByText("cafe charlotte")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to coffee shops" }),
    ).toHaveAttribute("href", "/");
  });

  it("keeps list and map filters consistent and preserves mobile-only shops", () => {
    render(
      <Directory
        data={{
          ok: true,
          shops: [
            {
              id: "shop-1",
              details: { name: "Uptown Coffee" },
              locations: [
                {
                  id: "location-1",
                  shopId: "shop-1",
                  details: {
                    neighborhoodId: "Uptown",
                    type: "cafe",
                    coordinates: { latitude: 35.2271, longitude: -80.8431 },
                  },
                },
              ],
            },
            {
              id: "shop-2",
              details: { name: "Mobile Beans" },
              locations: [
                {
                  id: "location-2",
                  shopId: "shop-2",
                  details: { type: "mobile coffee" },
                },
              ],
            },
          ],
        }}
      />,
      { container: document },
    );

    expect(screen.getByText("Uptown Coffee")).toBeVisible();
    expect(screen.getByText("Mobile Beans")).toBeVisible();
    expect(screen.getByText("1 mapped locations")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "mobile coffee" },
    });

    expect(screen.queryByText("Uptown Coffee")).not.toBeInTheDocument();
    expect(screen.getByText("Mobile Beans")).toBeVisible();
    expect(
      screen.getByText(/No filtered shops have fixed coordinates/),
    ).toBeVisible();
  });

  it("renders detail unavailable and fallback public values", () => {
    render(<ShopDetailContent data={{ ok: false, error: "not-found" }} />, {
      container: document,
    });
    expect(
      screen.getByRole("heading", { name: "Shop not found" }),
    ).toBeVisible();

    render(
      <ShopDetailContent
        data={{
          ok: true,
          shop: {
            id: "shop-2",
            details: {},
            locations: [
              { id: "location-2", shopId: "shop-2", details: {} },
              { id: "location-3", shopId: "shop-2", details: {} },
            ],
          },
        }}
      />,
      { container: document },
    );
    expect(
      screen.getByRole("heading", { name: "Unnamed coffee shop" }),
    ).toBeVisible();
    expect(screen.getByText("2 locations")).toBeVisible();
    expect(screen.getAllByText("Coffee shop")).toHaveLength(2);
  });

  describe("shop photos", () => {
    const shop = {
      id: "shop-1",
      details: {
        name: "Photo Shop",
        photos: [
          {
            id: "p1",
            alt: "Front counter",
            variants: [
              { width: 480, height: 320, key: "photos/p1/480.webp" },
              { width: 960, height: 640, key: "photos/p1/960.webp" },
            ],
          },
        ],
      },
      locations: [],
    };

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("renders responsive images with alt text when delivery is configured", () => {
      vi.stubEnv("VITE_PUBLIC_PHOTO_BASE_URL", "https://photos.example.test");
      render(<ShopDetailContent data={{ ok: true, shop }} />, {
        container: document,
      });

      const image = screen.getByRole("img", { name: "Front counter" });
      expect(image).toHaveAttribute(
        "src",
        "https://photos.example.test/photos/p1/960.webp",
      );
      expect(image).toHaveAttribute(
        "srcset",
        "https://photos.example.test/photos/p1/480.webp 480w, https://photos.example.test/photos/p1/960.webp 960w",
      );
      expect(image).toHaveAttribute("width", "960");
      expect(image).toHaveAttribute("height", "640");
      expect(image).toHaveAttribute("loading", "lazy");
    });

    it("omits photos but keeps the details when delivery is not configured", () => {
      vi.stubEnv("VITE_PUBLIC_PHOTO_BASE_URL", "");
      render(<ShopDetailContent data={{ ok: true, shop }} />, {
        container: document,
      });

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Photo Shop" })).toBeVisible();
    });
  });
});
