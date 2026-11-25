export type PublicationAction =
  | "publish-location"
  | "unpublish-location"
  | "republish-shop"
  | "retry-photo-delivery";

export type PublicationOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

async function unavailableMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      body.error === "photo-delivery-pending"
    ) {
      return "The change was saved, but photos could not be delivered. Reload the page and select Retry photo delivery.";
    }
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      body.error === "public-update-pending"
    ) {
      return "The change was saved, but the public update could not be triggered. Try again later.";
    }
  } catch {
    // A non-JSON response does not establish whether the change was saved.
  }
  return "Publication or the public update could not be completed. Check the current status and try again later.";
}

export async function updateLocationPublication(
  shopId: string,
  locationId: string | undefined,
  action: PublicationAction,
): Promise<PublicationOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/publication", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        ...(locationId === undefined ? {} : { locationId }),
        action,
      }),
    });
  } catch {
    return {
      ok: false,
      message:
        "Publication could not be updated. Check your connection and try again.",
    };
  }
  switch (response.status) {
    case 200:
      return { ok: true };
    case 401:
      return {
        ok: false,
        message: "Your session could not be verified. Please sign in again.",
      };
    case 403:
      return {
        ok: false,
        message: "This account is not approved to publish shops.",
      };
    case 422:
      return {
        ok: false,
        message:
          action === "republish-shop"
            ? "The shop details could not be republished."
            : action === "retry-photo-delivery"
              ? "Photo delivery could not be retried."
              : "This location could not be published.",
      };
    case 503:
      return {
        ok: false,
        message: await unavailableMessage(response),
      };
    default:
      return {
        ok: false,
        message: "Publication could not be updated. Try again.",
      };
  }
}
