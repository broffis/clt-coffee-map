import type { ShopCandidate } from "../domain/candidates";

export interface CandidateRepository {
  get(id: string): Promise<ShopCandidate | null>;
  listPending(): Promise<readonly ShopCandidate[]>;
  save(candidate: ShopCandidate): Promise<void>;
}
