import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRouter } from "../src/router";

describe("admin application scaffold", () => {
  it("does not offer private data or privileged actions before authorization exists", async () => {
    const router = getRouter();
    router.update({ history: createMemoryHistory({ initialEntries: ["/"] }) });
    await router.load();
    render(<RouterProvider router={router} />, { container: document });

    expect(
      await screen.findByRole("heading", {
        name: "Coffee Map administration",
        level: 1,
      }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.title).toBe("Coffee Map administration");
    expect(screen.getByText(/admin access is not configured/i)).toBeVisible();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
