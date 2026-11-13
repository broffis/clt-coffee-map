import { validateIdentifier } from "../domain/identifiers";
import { PersistenceError } from "./errors";

export function checkIdentifier(id: string, field: string): void {
  try {
    validateIdentifier(id, field);
  } catch (error) {
    throw new PersistenceError("validation", (error as Error).message);
  }
}

export function byId<T extends { readonly id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
