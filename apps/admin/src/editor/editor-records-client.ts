import type { PhotoValue } from "./ShopDraftForm";

export interface EditorLocationRecord {
  readonly id: string;
  readonly published: boolean;
  readonly type: string;
  readonly streetLine1: string;
  readonly streetLine2: string;
  readonly postalCode: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly website: string;
}

export interface EditorShopRecord {
  readonly id: string;
  readonly name: string;
  readonly website: string;
  readonly photos?: readonly PhotoValue[];
  readonly logoPhotoId?: string;
  readonly published: boolean;
  readonly locations: readonly EditorLocationRecord[];
}

export interface EditorRecords {
  readonly shops: readonly EditorShopRecord[];
}

export type LoadOutcome =
  | { readonly ok: true; readonly records: EditorRecords }
  | { readonly ok: false; readonly message: string };

function failure(message: string): LoadOutcome {
  return { ok: false, message };
}

export async function loadEditorRecordsRequest(): Promise<LoadOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/shops", {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    return failure(
      "Shops could not be loaded. Check your connection and try again.",
    );
  }
  if (response.status === 401) {
    return failure("Your session could not be verified. Please sign in again.");
  }
  if (response.status === 403) {
    return failure("This account is not approved to view shops.");
  }
  if (response.status !== 200) {
    return failure("Shops could not be loaded. Try again.");
  }
  try {
    const body = (await response.json()) as { shops?: unknown };
    if (Array.isArray(body.shops)) {
      return { ok: true, records: body as EditorRecords };
    }
  } catch {
    // Fall through to the generic failure.
  }
  return failure("Shops could not be loaded. Try again.");
}
