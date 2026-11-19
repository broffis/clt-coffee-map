import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRouter } from "../src/router";

const session = vi.hoisted(() => ({ signedIn: false }));
vi.mock("@clerk/tanstack-react-start", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  Show: ({ when, children }: { when: string; children: ReactNode }) =>
    session.signedIn === (when === "signed-in") ? children : null,
  SignInButton: ({ children }: { children: ReactNode }) => children,
  UserButton: () => <button type="button">Account</button>,
}));

beforeEach(() => {
  session.signedIn = false;
});

async function renderAdmin() {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/"] }) });
  await router.load();
  render(<RouterProvider router={router} />, { container: document });
}

describe("admin sign-in", () => {
  it("offers sign-in without exposing private data or editing actions", async () => {
    await renderAdmin();
    expect(
      await screen.findByRole("heading", {
        name: "Coffee Map administration",
        level: 1,
      }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.title).toBe("Coffee Map administration");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check admin access" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [200, /admin access is approved/i],
    [401, /sign in again/i],
    [403, /not approved for private admin access/i],
    [503, /permissions could not be verified/i],
    [500, /access check failed/i],
  ])(
    "shows an explicit result for access-check HTTP %s",
    async (status, text) => {
      session.signedIn = true;
      const fetch = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response(null, { status }));
      await renderAdmin();
      expect(
        await screen.findByText(/signing in does not grant/i),
      ).toBeVisible();

      fireEvent.click(
        screen.getByRole("button", { name: "Check admin access" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(text);
      expect(fetch).toHaveBeenCalledWith("/api/admin/access", {
        cache: "no-store",
        credentials: "same-origin",
      });
    },
  );

  it("shows the editor only to signed-in users and saves through the private endpoints", async () => {
    session.signedIn = true;
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_url, init) =>
        init?.method === "POST"
          ? Response.json({ ok: true, id: "s1" })
          : Response.json({ shops: [] }),
      );
    await renderAdmin();

    fireEvent.click(await screen.findByRole("button", { name: "New shop" }));
    fireEvent.change(screen.getByLabelText("Shop name"), {
      target: { value: "Bean There" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Draft saved.")).toBeVisible();
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/shops",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reports network failure and allows retrying the access check", async () => {
    session.signedIn = true;
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));
    await renderAdmin();

    fireEvent.click(
      await screen.findByRole("button", { name: "Check admin access" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /access check failed/i,
    );
    expect(
      screen.getByRole("button", { name: "Check admin access" }),
    ).toBeEnabled();
  });
});
