export type PublicationAction =
  | "publish-location"
  | "unpublish-location"
  | "republish-shop";

export type PublicationOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

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
            : "This location could not be published.",
      };
    case 503:
      return {
        ok: false,
        message:
          "The change was saved, but the public update could not be triggered. Try again later.",
      };
    default:
      return {
        ok: false,
        message: "Publication could not be updated. Try again.",
      };
  }
}
