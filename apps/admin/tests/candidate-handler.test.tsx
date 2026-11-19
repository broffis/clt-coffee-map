import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import {
  handleCandidateAction,
  handleCandidateList,
} from "../src/candidates/candidate-handler";
import { approveAccess } from "../src/domain/access";
import type { ShopCandidate } from "../src/domain/candidates";
import { PersistenceError } from "../src/persistence/errors";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { createInMemoryCandidateRepository } from "../src/persistence/candidate-memory";
import { createInMemoryRepositories } from "../src/persistence/memory";

const NOW = new Date("2026-11-19T20:00:00.000Z");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};
const candidate: ShopCandidate = {
  id: "candidate-1",
  source: "overture",
  sourceRecordId: "ov-1",
  release: "release-1",
  name: "Bean There",
  type: "cafe",
  address: null,
  coordinates: null,
  website: null,
  importedAt: NOW.toISOString(),
  status: "pending",
  reviewedBy: null,
  reviewedAt: null,
};

function post(body: unknown): Request {
  return new Request("https://admin.example.test/api/admin/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setup() {
  const access = createInMemoryAccessRepository();
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
    access,
    candidates,
  };
}

describe("candidate endpoint", () => {
  it("lists pending candidates with private no-store headers", async () => {
    const { deps, access, candidates } = setup();
    await access.save(approveAccess(null, "user_editor", NOW));
    await candidates.save(candidate);

    const response = await handleCandidateList(
      deps,
      new Request("https://admin.example.test/api/admin/candidates"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ candidates: [candidate] });
  });

  it("returns validation errors for malformed actions", async () => {
    const { deps, access } = setup();
    await access.save(approveAccess(null, "user_editor", NOW));

    const response = await handleCandidateAction(
      deps,
      post({ action: "review", candidateId: "", type: "cafe" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { candidateId: "Choose a candidate." },
    });
  });

  it("returns 401 before reading candidates for unsigned requests", async () => {
    const { deps, candidates } = setup();
    const response = await handleCandidateList(
      { ...deps, verifier: { verify: async () => null } },
      new Request("https://admin.example.test/api/admin/candidates"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(await candidates.listPending()).toEqual([]);
  });

  it("maps malformed JSON and invalid actions to client errors", async () => {
    const { deps, access } = setup();
    await access.save(approveAccess(null, "user_editor", NOW));

    const malformed = new Request(
      "https://admin.example.test/api/admin/candidates",
      { method: "POST", body: "not-json" },
    );
    await expect(handleCandidateAction(deps, malformed)).resolves.toMatchObject(
      {
        status: 400,
      },
    );
    await expect(
      handleCandidateAction(deps, post({ action: "other" })),
    ).resolves.toMatchObject({ status: 422 });
    await expect(
      handleCandidateAction(deps, post({ action: 1 })),
    ).resolves.toMatchObject({ status: 422 });
  });

  it("maps authorization, persistence, and validation failures", async () => {
    const { deps, access, candidates } = setup();
    const denied = await handleCandidateList(
      {
        ...deps,
        access: {
          get: async () => {
            throw new Error("database down");
          },
        },
      },
      new Request("https://admin.example.test/api/admin/candidates"),
    );
    expect(denied.status).toBe(503);

    await access.save(approveAccess(null, "user_editor", NOW));
    const unavailable = await handleCandidateList(
      {
        ...deps,
        candidates: {
          ...candidates,
          listPending: async () => {
            throw new PersistenceError("unavailable", "database down");
          },
        },
      },
      new Request("https://admin.example.test/api/admin/candidates"),
    );
    expect(unavailable.status).toBe(503);

    const invalid = await handleCandidateAction(
      deps,
      post({ action: "stage", candidates: "not-a-list" }),
    );
    expect(invalid.status).toBe(422);
  });

  it("maps denied access and service validation errors", async () => {
    const { deps, candidates, access } = setup();
    const denied = await handleCandidateList(
      { ...deps, access: createInMemoryAccessRepository() },
      new Request("https://admin.example.test/api/admin/candidates"),
    );
    expect(denied.status).toBe(403);

    await access.save(approveAccess(null, "user_editor", NOW));
    const invalid = await handleCandidateAction(
      deps,
      post({
        action: "stage",
        candidates: [{ ...candidate, name: "" }],
      }),
    );
    expect(invalid.status).toBe(422);
    expect(await candidates.listPending()).toEqual([]);
  });

  it("handles successful stage and review actions", async () => {
    const { deps, access } = setup();
    await access.save(approveAccess(null, "user_editor", NOW));
    const staged = await handleCandidateAction(
      deps,
      post({ action: "stage", candidates: [candidate] }),
    );
    expect(staged.status).toBe(200);
    const reviewed = await handleCandidateAction(
      deps,
      post({ action: "review", candidateId: candidate.id, type: "cafe" }),
    );
    expect(reviewed.status).toBe(200);
  });
});
