import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorWorkspace } from "../src/editor/EditorWorkspace";
import type { CandidateLoadOutcome } from "../src/editor/candidate-client";
import type { SaveOutcome } from "../src/editor/draft-request";
import type { LoadOutcome } from "../src/editor/editor-records-client";
import type { PublicationOutcome } from "../src/editor/publication-client";

const records = {
  shops: [
    {
      id: "s1",
      name: "Bean There",
      website: "https://bean.example.test",
      published: false,
      locations: [
        {
          id: "l1",
          published: false,
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
    updatePublication?: () => Promise<PublicationOutcome>;
    loadCandidates?: () => Promise<CandidateLoadOutcome>;
    reviewCandidate?: () => Promise<SaveOutcome>;
  } = {},
) {
  const load = vi.fn(options.load ?? (async () => ({ ok: true, records })));
  const saveShop = vi.fn(options.saveShop ?? (async () => ({ ok: true })));
  const saveLocation = vi.fn(
    options.saveLocation ?? (async () => ({ ok: true })),
  );
  const updatePublication = vi.fn(
    options.updatePublication ?? (async () => ({ ok: true })),
  );
  render(
    <EditorWorkspace
      load={load as never}
      saveShop={saveShop as never}
      saveLocation={saveLocation as never}
      updatePublication={updatePublication as never}
      loadCandidates={options.loadCandidates as never}
      reviewCandidate={options.reviewCandidate as never}
    />,
  );
  return { load, saveShop, saveLocation, updatePublication };
}

describe("EditorWorkspace", () => {
  it("lists shops with their locations after loading", async () => {
    setup();

    expect(screen.getByText("Loading shops...")).toBeVisible();
    expect(await screen.findByText("Bean There")).toBeVisible();
    expect(screen.getByText(/1 Main St/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Publish" })).toBeVisible();
  });

  it("publishes an unpublished location and reports success", async () => {
    const { updatePublication } = setup();
    await screen.findByText("Bean There");

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() =>
      expect(updatePublication).toHaveBeenCalledWith(
        "s1",
        "l1",
        "publish-location",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location published.",
    );
  });

  it("republishes shared shop details", async () => {
    const { updatePublication } = setup({
      load: async () => ({
        ok: true,
        records: {
          ...records,
          shops: records.shops.map((shop) => ({ ...shop, published: true })),
        },
      }),
    });
    await screen.findByText("Bean There");

    fireEvent.click(
      screen.getByRole("button", { name: "Republish shop details" }),
    );

    await waitFor(() =>
      expect(updatePublication).toHaveBeenCalledWith(
        "s1",
        undefined,
        "republish-shop",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Shop details republished.",
    );
  });

  it("unpublishes a published location", async () => {
    const { updatePublication } = setup({
      load: async () => ({
        ok: true,
        records: {
          ...records,
          shops: records.shops.map((shop) => ({
            ...shop,
            locations: shop.locations.map((location) => ({
              ...location,
              published: true,
            })),
          })),
        },
      }),
    });
    await screen.findByText("Bean There");

    fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));

    await waitFor(() =>
      expect(updatePublication).toHaveBeenCalledWith(
        "s1",
        "l1",
        "unpublish-location",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location unpublished.",
    );
  });

  it("reports publication failures", async () => {
    setup({
      updatePublication: async () => ({
        ok: false,
        message: "Publishing is unavailable.",
      }),
    });
    await screen.findByText("Bean There");

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Publishing is unavailable.",
    );
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
              published: false,
              locations: [
                {
                  id: "l2",
                  published: false,
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

  it("shows source candidates and reviews one as a draft", async () => {
    const reviewCandidate = vi.fn(async () => ({ ok: true as const }));
    const loadCandidates = vi.fn(async () => ({
      ok: true as const,
      candidates: [
        {
          id: "candidate-1",
          source: "overture" as const,
          sourceRecordId: "ov-1",
          release: "release-1",
          name: "Candidate Coffee",
          type: null,
          address: null,
          coordinates: null,
          website: null,
          importedAt: "2026-11-19T20:00:00.000Z",
          status: "pending" as const,
          reviewedBy: null,
          reviewedAt: null,
        },
      ],
    }));
    setup({ loadCandidates, reviewCandidate });

    expect(await screen.findByText("Candidate Coffee")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Edited Candidate Coffee" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review as draft" }));
    await waitFor(() =>
      expect(reviewCandidate).toHaveBeenCalledWith(
        "candidate-1",
        "cafe",
        "Edited Candidate Coffee",
        "",
      ),
    );
    expect(loadCandidates).toHaveBeenCalledTimes(2);
  });

  it("reports candidate loading failures", async () => {
    setup({
      loadCandidates: async () => ({
        ok: false,
        message: "Candidates unavailable.",
      }),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Candidates unavailable.",
    );
  });

  it("reports candidate review failures", async () => {
    const reviewCandidate = vi.fn(async () => ({
      ok: false as const,
      message: "Candidate review failed.",
    }));
    setup({
      loadCandidates: async () => ({
        ok: true as const,
        candidates: [
          {
            id: "candidate-2",
            source: "overture" as const,
            sourceRecordId: "ov-2",
            release: "release-1",
            name: "Review Failure",
            type: "bakery" as const,
            address: null,
            coordinates: null,
            website: null,
            importedAt: "2026-11-19T20:00:00.000Z",
            status: "pending" as const,
            reviewedBy: null,
            reviewedAt: null,
          },
        ],
      }),
      reviewCandidate,
    });
    expect(await screen.findByText("Review Failure")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Review as draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Candidate review failed.",
    );
  });
});
