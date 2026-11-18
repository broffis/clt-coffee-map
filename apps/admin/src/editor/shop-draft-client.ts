import type { SaveOutcome, ShopDraftValues } from "./ShopDraftForm";

const FAILED = "The draft could not be saved. Try again.";

function failure(message: string): SaveOutcome {
  return { ok: false, message };
}

// Server error details are never surfaced; only the field errors that the
// validation endpoint intentionally returns.
export async function saveShopDraftRequest(
  values: ShopDraftValues,
): Promise<SaveOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/shops", {
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
    case 200:
      return { ok: true };
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
