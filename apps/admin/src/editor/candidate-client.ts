import type { SaveOutcome } from "./draft-request";

export interface CandidateRecord {
  readonly id: string;
  readonly sourceRecordId: string;
  readonly release: string;
  readonly name: string;
  readonly type: string | null;
  readonly website: string | null;
}

export type CandidateLoadOutcome =
  | { readonly ok: true; readonly candidates: readonly CandidateRecord[] }
  | { readonly ok: false; readonly message: string };

function failure(message: string): CandidateLoadOutcome {
  return { ok: false, message };
}

export async function loadCandidateRequest(): Promise<CandidateLoadOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/candidates", {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    return failure(
      "Candidates could not be loaded. Check your connection and try again.",
    );
  }
  if (response.status === 401) {
    return failure("Your session could not be verified. Please sign in again.");
  }
  if (response.status === 403) {
    return failure("This account is not approved to view candidates.");
  }
  if (response.status !== 200) {
    return failure("Candidates could not be loaded. Try again.");
  }
  try {
    const body = (await response.json()) as { candidates?: unknown };
    if (Array.isArray(body.candidates)) {
      return {
        ok: true,
        candidates: body.candidates as CandidateRecord[],
      };
    }
  } catch {
    // Fall through to the generic failure.
  }
  return failure("Candidates could not be loaded. Try again.");
}

export async function reviewCandidateRequest(
  candidateId: string,
  type: string,
  name?: string,
  website?: string,
): Promise<SaveOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/candidates", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review",
        candidateId,
        type,
        name,
        website,
      }),
    });
  } catch {
    return {
      ok: false,
      message: "The candidate could not be reviewed. Check your connection.",
    };
  }
  if (response.status === 200) {
    try {
      const body = (await response.json()) as { id?: unknown };
      return typeof body.id === "string"
        ? { ok: true, id: body.id }
        : { ok: true };
    } catch {
      return { ok: true };
    }
  }
  if (response.status === 401) {
    return {
      ok: false,
      message: "Your session could not be verified. Please sign in again.",
    };
  }
  if (response.status === 403) {
    return {
      ok: false,
      message: "This account is not approved to review candidates.",
    };
  }
  if (response.status === 422) {
    try {
      const body = (await response.json()) as { errors?: unknown };
      if (typeof body.errors === "object" && body.errors !== null) {
        return { ok: false, errors: body.errors };
      }
    } catch {
      // Fall through to the generic failure.
    }
  }
  return {
    ok: false,
    message: "The candidate could not be reviewed. Try again.",
  };
}
