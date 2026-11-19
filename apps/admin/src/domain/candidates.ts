import { validateIdentifier } from "./identifiers";
import type { LocationType } from "./location";
import { validateHttpsUrl } from "./validation";

export type CandidateStatus = "pending" | "reviewed" | "dismissed";

export interface ShopCandidate {
  readonly id: string;
  readonly source: "overture";
  readonly sourceRecordId: string;
  readonly release: string;
  readonly name: string;
  readonly type: LocationType | null;
  readonly address: {
    readonly streetLine1: string | null;
    readonly city: string | null;
    readonly postalCode: string | null;
  } | null;
  readonly coordinates: {
    readonly latitude: number;
    readonly longitude: number;
  } | null;
  readonly website: string | null;
  readonly importedAt: string;
  readonly status: CandidateStatus;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
}

export function validateCandidate(candidate: ShopCandidate): void {
  validateIdentifier(candidate.id, "Candidate ID");
  if (candidate.sourceRecordId.trim() === "") {
    throw new RangeError("Candidate source record ID must not be blank.");
  }
  if (candidate.release.trim() === "") {
    throw new RangeError("Candidate release must not be blank.");
  }
  if (candidate.name.trim() === "") {
    throw new RangeError("Candidate name must not be blank.");
  }
  if (candidate.website !== null) {
    validateHttpsUrl(candidate.website, "Candidate website");
  }
  if (candidate.coordinates !== null) {
    const { latitude, longitude } = candidate.coordinates;
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new RangeError("Candidate coordinates are invalid.");
    }
  }
  if (
    !["pending", "reviewed", "dismissed"].includes(candidate.status) ||
    (candidate.status === "pending" &&
      (candidate.reviewedBy !== null || candidate.reviewedAt !== null)) ||
    (candidate.status !== "pending" &&
      (candidate.reviewedBy === null || candidate.reviewedAt === null))
  ) {
    throw new RangeError("Candidate review state is invalid.");
  }
}
