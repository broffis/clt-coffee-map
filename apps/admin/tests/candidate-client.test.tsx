import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadCandidateRequest,
  reviewCandidateRequest,
} from "../src/editor/candidate-client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("candidate client", () => {
  it("loads candidates privately", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ candidates: [] }));

    await expect(loadCandidateRequest()).resolves.toEqual({
      ok: true,
      candidates: [],
    });
    expect(fetch).toHaveBeenCalledWith("/api/admin/candidates", {
      cache: "no-store",
      credentials: "same-origin",
    });
  });

  it.each([
    [401, /sign in again/i],
    [403, /not approved/i],
    [500, /could not be loaded/i],
  ])("maps candidate load status %s", async (status, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status }),
    );
    await expect(loadCandidateRequest()).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(message),
    });
  });

  it("maps malformed and network load failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>", { status: 200 }),
    );
    await expect(loadCandidateRequest()).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(/could not be loaded/i),
    });
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(loadCandidateRequest()).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(/check your connection/i),
    });
  });

  it("reviews a candidate and maps response errors", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ id: "shop-1" }, { status: 200 }));

    await expect(
      reviewCandidateRequest("candidate-1", "cafe"),
    ).resolves.toEqual({ ok: true, id: "shop-1" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/candidates",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "review",
          candidateId: "candidate-1",
          type: "cafe",
        }),
      }),
    );

    for (const [status, message] of [
      [401, /sign in again/i],
      [403, /not approved/i],
      [500, /could not be reviewed/i],
    ] as const) {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status }));
      await expect(
        reviewCandidateRequest("candidate-1", "cafe"),
      ).resolves.toEqual({
        ok: false,
        message: expect.stringMatching(message),
      });
    }
  });

  it("returns field errors and generic failures for review responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json(
        { errors: { type: "Choose a valid location type." } },
        { status: 422 },
      ),
    );
    await expect(reviewCandidateRequest("candidate-1", "bad")).resolves.toEqual(
      {
        ok: false,
        errors: { type: "Choose a valid location type." },
      },
    );

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("<html>", { status: 422 }),
    );
    await expect(reviewCandidateRequest("candidate-1", "bad")).resolves.toEqual(
      {
        ok: false,
        message: expect.stringMatching(/could not be reviewed/i),
      },
    );

    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await expect(
      reviewCandidateRequest("candidate-1", "cafe"),
    ).resolves.toEqual({
      ok: false,
      message: expect.stringMatching(/check your connection/i),
    });
  });
});
