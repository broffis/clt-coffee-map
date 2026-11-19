import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import type { ShopCandidate } from "../domain/candidates";
import { validateCandidate } from "../domain/candidates";
import type {
  LocationSourceField,
  LocationType,
  ShopLocation,
} from "../domain/location";
import type { Shop } from "../domain/shop";
import type { SourceReference } from "../domain/sources";
import type { RegionDefaults } from "../editor/region-defaults";
import type { AccessRepository } from "../persistence/access-repository";
import type { CandidateRepository } from "../persistence/candidate-repository";
import type { Repositories } from "../persistence/repositories";

export interface CandidateDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly candidates: CandidateRepository;
  readonly repositories: Pick<Repositories, "shops" | "locations">;
  readonly verifier: SessionVerifier<Request>;
  readonly defaults: RegionDefaults;
  readonly newShopId: () => string;
  readonly newLocationId: () => string;
  readonly now: () => Date;
}

export type CandidateErrors = Partial<
  Record<"form" | "candidateId" | "type", string>
>;

export type CandidateResult =
  | { readonly ok: true; readonly candidates: readonly ShopCandidate[] }
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly errors: CandidateErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function candidateSource<Field extends "name" | "links" | LocationSourceField>(
  candidate: ShopCandidate,
  fields: readonly Field[],
): readonly SourceReference<Field>[] {
  return [
    {
      name: "Overture Places",
      url: "https://docs.overturemaps.org/guides/places/",
      recordId: candidate.sourceRecordId,
      release: candidate.release,
      license: "CDLA Permissive 2.0",
      verifiedOn: null,
      fields,
    },
  ];
}

function locationSourceFields(
  candidate: ShopCandidate,
): readonly ("type" | "coordinates" | "address" | "links")[] {
  return [
    ...(candidate.type === null ? [] : ["type" as const]),
    ...(candidate.coordinates === null ? [] : ["coordinates" as const]),
    ...(candidate.address === null ? [] : ["address" as const]),
    ...(candidate.website === null ? [] : ["links" as const]),
  ];
}

export async function listPendingCandidates(
  deps: CandidateDependencies,
  request: Request,
): Promise<readonly ShopCandidate[]> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "private:read",
  );
  return deps.candidates.listPending();
}

export async function stageCandidates(
  deps: CandidateDependencies,
  request: Request,
  input: unknown,
): Promise<CandidateResult> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "shop:edit",
  );
  if (!Array.isArray(input)) {
    return {
      ok: false,
      errors: { form: "Candidate data must be a list." },
    };
  }
  for (const value of input) {
    if (typeof value !== "object" || value === null) {
      return {
        ok: false,
        errors: { form: "Candidate data is not valid." },
      };
    }
    const candidate = value as ShopCandidate;
    validateCandidate(candidate);
    await deps.candidates.save(candidate);
  }
  return { ok: true, candidates: await deps.candidates.listPending() };
}

export async function reviewCandidate(
  deps: CandidateDependencies,
  request: Request,
  input: unknown,
): Promise<CandidateResult> {
  const identity = await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "shop:edit",
  );
  if (typeof input !== "object" || input === null) {
    return {
      ok: false,
      errors: { form: "Candidate review data is not valid." },
    };
  }
  const fields = input as Record<string, unknown>;
  const candidateId = text(fields.candidateId);
  const type = text(fields.type) as LocationType;
  if (candidateId === "") {
    return { ok: false, errors: { candidateId: "Choose a candidate." } };
  }
  if (!["cafe", "bakery", "mobile coffee", "coffee roaster"].includes(type)) {
    return { ok: false, errors: { type: "Choose a valid location type." } };
  }

  const candidate = await deps.candidates.get(candidateId);
  if (candidate === null || candidate.status !== "pending") {
    return { ok: false, errors: { form: "Candidate is no longer available." } };
  }
  const editedCandidate: ShopCandidate = {
    ...candidate,
    name: typeof fields.name === "string" ? fields.name.trim() : candidate.name,
    website:
      fields.website === undefined
        ? candidate.website
        : text(fields.website) === ""
          ? null
          : text(fields.website),
  };
  validateCandidate(editedCandidate);

  const shopId = deps.newShopId();
  const locationId = deps.newLocationId();
  const shop: Shop = {
    id: shopId,
    draft: {
      name: editedCandidate.name,
      links:
        editedCandidate.website === null
          ? null
          : { website: editedCandidate.website, other: [] },
      sources: candidateSource(
        editedCandidate,
        editedCandidate.website === null ? ["name"] : ["name", "links"],
      ),
    },
    published: null,
  };
  const location: ShopLocation = {
    id: locationId,
    shopId,
    draft: {
      regionId: deps.defaults.regionId,
      cityId: deps.defaults.cityId,
      neighborhoodId: null,
      type,
      coordinates: editedCandidate.coordinates,
      address:
        editedCandidate.address === null
          ? null
          : {
              streetLine1: editedCandidate.address.streetLine1,
              streetLine2: null,
              postalCode: editedCandidate.address.postalCode,
            },
      links:
        editedCandidate.website === null
          ? null
          : { website: editedCandidate.website, other: [] },
      hoursInfoUrl: null,
      regularHours: null,
      roasters: null,
      coffeeOptions: null,
      nonCoffeeDrinks: null,
      food: null,
      sources: candidateSource(
        editedCandidate,
        locationSourceFields(editedCandidate),
      ),
    },
    published: null,
  };

  await deps.repositories.shops.save(shop);
  await deps.repositories.locations.save(location);
  await deps.candidates.save({
    ...editedCandidate,
    status: "reviewed",
    reviewedBy: identity.userId,
    reviewedAt: deps.now().toISOString(),
  });
  return { ok: true, id: shopId };
}
