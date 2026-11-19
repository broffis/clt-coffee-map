import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import {
  listPendingCandidates,
  reviewCandidate,
  stageCandidates,
} from "../src/candidates/candidate-service";
import { approveAccess } from "../src/domain/access";
import type { ShopCandidate } from "../src/domain/candidates";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryCandidateRepository } from "../src/persistence/candidate-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-19T20:00:00.000Z");
const request = new Request("https://admin.example.test/api/admin/candidates");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

const candidate: ShopCandidate = {
  id: "candidate-1",
  source: "overture",
  sourceRecordId: "ov-1",
  release: "2026-09-24.0",
  name: "Bean There",
  type: null,
  address: {
    streetLine1: "100 Main Street",
    city: "Charlotte",
    postalCode: "28202",
  },
  coordinates: { latitude: 35.227, longitude: -80.843 },
  website: "https://bean.example",
  importedAt: NOW.toISOString(),
  status: "pending",
  reviewedBy: null,
  reviewedAt: null,
};

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_editor", NOW));
  const candidates = createInMemoryCandidateRepository();
  const repositories = createInMemoryRepositories();
  return {
    deps: {
      access,
      candidates,
      repositories,
      verifier,
      defaults: { regionId: "region", cityId: "city" },
      newShopId: () => "shop-new",
      newLocationId: () => "location-new",
      now: () => NOW,
    },
    candidates,
    repositories,
  };
}

describe("candidate workflow", () => {
  it("stages candidates privately without adding curated shops", async () => {
    const { deps, repositories } = await setup();

    await expect(stageCandidates(deps, request, [candidate])).resolves.toEqual({
      ok: true,
      candidates: [candidate],
    });
    await expect(repositories.shops.list()).resolves.toEqual([]);
    await expect(listPendingCandidates(deps, request)).resolves.toEqual([
      candidate,
    ]);
  });

  it("reviews a candidate into unpublished curated drafts", async () => {
    const { deps, candidates, repositories } = await setup();
    await stageCandidates(deps, request, [candidate]);

    await expect(
      reviewCandidate(deps, request, {
        candidateId: candidate.id,
        type: "cafe",
        name: "Edited Bean There",
        website: "",
      }),
    ).resolves.toEqual({ ok: true, id: "shop-new" });

    const shop = await repositories.shops.get("shop-new");
    const location = await repositories.locations.get("location-new");
    expect(shop?.published).toBeNull();
    expect(shop?.draft.name).toBe("Edited Bean There");
    expect(shop?.draft.links).toBeNull();
    expect(shop?.draft.sources?.[0]).toMatchObject({
      recordId: candidate.sourceRecordId,
      release: candidate.release,
    });
    expect(location?.published).toBeNull();
    expect(location?.draft.address?.streetLine1).toBe("100 Main Street");
    expect((await candidates.get(candidate.id))?.status).toBe("reviewed");
  });

  it("requires an approved session before reading or reviewing candidates", async () => {
    const { deps } = await setup();
    const denied = {
      ...deps,
      access: createInMemoryAccessRepository(),
    };

    await expect(listPendingCandidates(denied, request)).rejects.toMatchObject({
      reason: "no-access",
    });
    await expect(
      reviewCandidate(denied, request, {
        candidateId: candidate.id,
        type: "cafe",
      }),
    ).rejects.toMatchObject({ reason: "no-access" });
  });

  it("rejects malformed staging and review input", async () => {
    const { deps } = await setup();
    await expect(stageCandidates(deps, request, "not-a-list")).resolves.toEqual(
      {
        ok: false,
        errors: { form: "Candidate data must be a list." },
      },
    );
    await expect(stageCandidates(deps, request, [null])).resolves.toEqual({
      ok: false,
      errors: { form: "Candidate data is not valid." },
    });
    await expect(reviewCandidate(deps, request, null)).resolves.toEqual({
      ok: false,
      errors: { form: "Candidate review data is not valid." },
    });
    await expect(
      reviewCandidate(deps, request, { candidateId: "", type: "cafe" }),
    ).resolves.toEqual({
      ok: false,
      errors: { candidateId: "Choose a candidate." },
    });
    await expect(
      reviewCandidate(deps, request, {
        candidateId: candidate.id,
        type: "invalid",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { type: "Choose a valid location type." },
    });
  });

  it("does not review missing or already reviewed candidates", async () => {
    const { deps, candidates } = await setup();
    await expect(
      reviewCandidate(deps, request, {
        candidateId: "missing",
        type: "cafe",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Candidate is no longer available." },
    });
    await candidates.save({
      ...candidate,
      status: "reviewed",
      reviewedBy: "user_editor",
      reviewedAt: NOW.toISOString(),
    });
    await expect(
      reviewCandidate(deps, request, {
        candidateId: candidate.id,
        type: "cafe",
      }),
    ).resolves.toEqual({
      ok: false,
      errors: { form: "Candidate is no longer available." },
    });
  });

  it("reviews candidates without optional source fields", async () => {
    const { deps, repositories } = await setup();
    const sparse = {
      ...candidate,
      address: null,
      coordinates: null,
      website: null,
    };
    await stageCandidates(deps, request, [sparse]);
    await expect(
      reviewCandidate(deps, request, {
        candidateId: sparse.id,
        type: "coffee roaster",
      }),
    ).resolves.toEqual({ ok: true, id: "shop-new" });
    const location = await repositories.locations.get("location-new");
    expect(location?.draft.address).toBeNull();
    expect(location?.draft.links).toBeNull();
    expect(location?.draft.sources?.[0].fields).toEqual([]);
  });
});
