export type SaveOutcome<Field extends string = string> =
  | { readonly ok: true; readonly id?: string }
  | {
      readonly ok: false;
      readonly errors?: Partial<Record<Field | "form", string>>;
      readonly message?: string;
    };

const FAILED = "The draft could not be saved. Try again.";

function failure(message: string): SaveOutcome {
  return { ok: false, message };
}

// Server error details are never surfaced; only the field errors that the
// validation endpoints intentionally return.
export async function postDraftRequest(
  url: string,
  values: object,
): Promise<SaveOutcome> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  } catch {
    return failure(
      "The draft could not be saved. Check your connection and try again.",
    );
  }
  switch (response.status) {
    case 200: {
      try {
        const body = (await response.json()) as { id?: unknown };
        return typeof body.id === "string"
          ? { ok: true, id: body.id }
          : { ok: true };
      } catch {
        return { ok: true };
      }
    }
    case 400:
    case 422:
      try {
        const body = (await response.json()) as { errors?: unknown };
        if (typeof body.errors === "object" && body.errors !== null) {
          return { ok: false, errors: body.errors };
        }
      } catch {
        // Fall through to the generic failure.
      }
      return failure(FAILED);
    case 401:
      return failure(
        "Your session could not be verified. Please sign in again.",
      );
    case 403:
      return failure("This account is not approved to edit shops.");
    case 503:
      return failure("Saving is unavailable right now. Try again later.");
    default:
      return failure(FAILED);
  }
}
