import { editorHeaders, respondToEditorError } from "../editor/editor-response";
import { type PhotoUploadDependencies, uploadPhoto } from "./upload-service";

export async function handlePhotoUpload(
  deps: PhotoUploadDependencies,
  request: Request,
): Promise<Response> {
  try {
    const result = await uploadPhoto(deps, request);
    if (result.ok) {
      return Response.json(result, { headers: editorHeaders });
    }
    return Response.json(
      { ok: false, errors: result.errors },
      {
        status: result.code === "too-large" ? 413 : 422,
        headers: editorHeaders,
      },
    );
  } catch (error) {
    return respondToEditorError(error);
  }
}
