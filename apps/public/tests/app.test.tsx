import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
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
    expect(screen.getByText("cafe (charlotte)")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to coffee shops" }),
    ).toHaveAttribute("href", "/");
  });
});
