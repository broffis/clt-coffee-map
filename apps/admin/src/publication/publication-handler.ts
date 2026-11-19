import { respondToEditorWrite } from "../editor/editor-response";
import {
  type PublicationDependencies,
  updatePublication,
} from "./publication-service";

export function handlePublicationUpdate(
  deps: PublicationDependencies,
  request: Request,
): Promise<Response> {
  return respondToEditorWrite(request, (input) =>
    updatePublication(deps, request, input),
  );
}
