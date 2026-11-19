import { respondToEditorWrite } from "./editor-response";
import {
  type LocationDraftDependencies,
  saveLocationDraft,
} from "./location-draft-service";

export function handleLocationDraftSave(
  deps: LocationDraftDependencies,
  request: Request,
): Promise<Response> {
  return respondToEditorWrite(request, (input) =>
    saveLocationDraft(deps, request, input),
  );
}
