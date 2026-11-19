import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorWorkspace } from "../src/editor/EditorWorkspace";
import type { LoadOutcome } from "../src/editor/editor-records-client";

const records = {
  shops: [
    {
      id: "s1",
      name: "Bean There",
      website: "https://bean.example.test",
      locations: [
        {
          id: "l1",
          type: "cafe",
          streetLine1: "1 Main St",
          streetLine2: "",
          postalCode: "28202",
          latitude: "35.2",
          longitude: "-80.8",
          website: "",
        },
      ],
    },
  ],
};

function setup(
  options: {
    load?: () => Promise<LoadOutcome>;
    saveShop?: () => Promise<{ ok: true; id?: string }>;
    saveLocation?: () => Promise<{ ok: true; id?: string }>;
  } = {},
) {
  const load = vi.fn(options.load ?? (async () => ({ ok: true, records })));
  const saveShop = vi.fn(options.saveShop ?? (async () => ({ ok: true })));
  const saveLocation = vi.fn(
    options.saveLocation ?? (async () => ({ ok: true })),
  );
  render(
    <EditorWorkspace
      load={load as never}
      saveShop={saveShop as never}
      saveLocation={saveLocation as never}
    />,
  );
  return { load, saveShop, saveLocation };
}

describe("EditorWorkspace", () => {
  it("lists shops with their locations after loading", async () => {
    setup();

    expect(screen.getByText("Loading shops...")).toBeVisible();
    expect(await screen.findByText("Bean There")).toBeVisible();
    expect(screen.getByText(/1 Main St/)).toBeVisible();
  });

  it("reports a load failure and retries", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        message: "Shops could not be loaded.",
      })
      .mockResolvedValueOnce({ ok: true, records });
    setup({ load });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Shops could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Bean There")).toBeVisible();
  });

  it("edits an existing shop, sending its id", async () => {
    const { saveShop } = setup();
    await screen.findByText("Bean There");

    fireEvent.click(
      screen.getByRole("button", { name: "Edit shop Bean There" }),
    );
    expect(screen.getByLabelText("Shop name")).toHaveValue("Bean There");
    fireEvent.change(screen.getByLabelText("Shop name"), {
      target: { value: "Bean Here" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() =>
      expect(saveShop).toHaveBeenCalledWith({
        id: "s1",
        name: "Bean Here",
        website: "https://bean.example.test",
      }),
    );
  });

  it("creates a shop, then edits it by id and refreshes the list", async () => {
    const { saveShop, load } = setup({
      saveShop: async () => ({ ok: true, id: "new-1" }),
    });
    await screen.findByText("Bean There");

    fireEvent.click(screen.getByRole("button", { name: "New shop" }));
    fireEvent.change(screen.getByLabelText("Shop name"), {
      target: { value: "Fresh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Draft saved.");
    expect(saveShop).toHaveBeenLastCalledWith({
      name: "Fresh",
      website: "",
    });
    expect(load).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(saveShop).toHaveBeenLastCalledWith({
        id: "new-1",
        name: "Fresh",
        website: "",
      }),
    );
  });

  it("edits a location with its id and creates one without", async () => {
    const { saveLocation } = setup();
    await screen.findByText("Bean There");

    fireEvent.click(
      screen.getByRole("button", { name: "Edit location 1 Main St (cafe)" }),
    );
    expect(screen.getByLabelText("Street address")).toHaveValue("1 Main St");
    fireEvent.click(screen.getByRole("button", { name: "Save location" }));
    await waitFor(() =>
      expect(saveLocation).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "l1", shopId: "s1" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "New location" }));
    expect(screen.getByLabelText("Street address")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Shop"), {
      target: { value: "s1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save location" }));
    await waitFor(() =>
      expect(saveLocation).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ id: expect.anything() }),
      ),
    );
  });

  it("describes locations without a street address by type", async () => {
    setup({
      load: async () => ({
        ok: true,
        records: {
          shops: [
            {
              id: "s2",
              name: "Truck",
              website: "",
              locations: [
                {
                  id: "l2",
                  type: "mobile coffee",
                  streetLine1: "",
                  streetLine2: "",
                  postalCode: "",
                  latitude: "",
                  longitude: "",
                  website: "",
                },
              ],
            },
          ],
        },
      }),
    });

    expect(
      await screen.findByRole("button", {
        name: "Edit location mobile coffee",
      }),
    ).toBeVisible();
  });

  it("asks for a shop first when none exist", async () => {
    setup({ load: async () => ({ ok: true, records: { shops: [] } }) });

    expect(await screen.findByText(/No shops yet/)).toBeVisible();
    expect(screen.getByRole("button", { name: "New location" })).toBeDisabled();
  });
});
