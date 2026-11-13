export type PersistenceErrorCode =
  | "validation"
  | "not-found"
  | "conflict"
  | "missing-reference";

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;

  constructor(code: PersistenceErrorCode, message: string) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
  }
}
