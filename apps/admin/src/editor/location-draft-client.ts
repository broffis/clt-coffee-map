import { postDraftRequest, type SaveOutcome } from "./draft-request";

export interface LocationDraftValues {
  readonly shopId: string;
  readonly type: string;
  readonly streetLine1: string;
  readonly streetLine2: string;
  readonly postalCode: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly website: string;
}

export function saveLocationDraftRequest(
  values: LocationDraftValues & { readonly id?: string },
): Promise<SaveOutcome> {
  return postDraftRequest("/api/admin/locations", values);
}
