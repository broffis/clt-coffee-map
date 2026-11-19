import { respondToEditorWrite } from "./editor-response";
import {
  type ShopDraftDependencies,
  saveShopDraft,
} from "./shop-draft-service";

export function handleShopDraftSave(
  deps: ShopDraftDependencies,
  request: Request,
): Promise<Response> {
  return respondToEditorWrite(request, (input) =>
    saveShopDraft(deps, request, input),
  );
}
