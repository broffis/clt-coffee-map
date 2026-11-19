import { postDraftRequest, type SaveOutcome } from "./draft-request";
import type { ShopDraftValues } from "./ShopDraftForm";

export function saveShopDraftRequest(
  values: ShopDraftValues & { readonly id?: string },
): Promise<SaveOutcome> {
  return postDraftRequest("/api/admin/shops", values);
}
