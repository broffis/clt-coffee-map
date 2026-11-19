import type { ShopCandidate } from "../domain/candidates";
import { validateCandidate } from "../domain/candidates";
import type { CandidateRepository } from "./candidate-repository";
import { byId, checkIdentifier } from "./checks";

export function createInMemoryCandidateRepository(): CandidateRepository {
  const records = new Map<string, ShopCandidate>();
  return {
    async get(id) {
      checkIdentifier(id, "Candidate ID");
      const candidate = records.get(id);
      return candidate === undefined ? null : structuredClone(candidate);
    },
    async listPending() {
      return [...records.values()]
        .filter((candidate) => candidate.status === "pending")
        .sort(byId)
        .map((candidate) => structuredClone(candidate));
    },
    async save(candidate) {
      validateCandidate(candidate);
      records.set(candidate.id, structuredClone(candidate));
    },
  };
}
