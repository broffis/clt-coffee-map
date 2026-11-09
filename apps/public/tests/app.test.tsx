import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRouter } from "../src/router";

describe("public application scaffold", () => {
  it("provides an account-free landing page without pretending shop data is ready", async () => {
    const router = getRouter();
    router.update({ history: createMemoryHistory({ initialEntries: ["/"] }) });
    await router.load();
    render(<RouterProvider router={router} />, { container: document });

    expect(
      await screen.findByRole("heading", { name: "CLT Coffee Map", level: 1 }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.title).toBe("CLT Coffee Map");
    expect(screen.getByText(/directory is being prepared/i)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });
});
