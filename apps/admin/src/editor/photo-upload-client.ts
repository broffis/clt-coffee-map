export interface UploadedPhoto {
  readonly id: string;
  readonly variants: readonly {
    readonly width: number;
    readonly height: number;
    readonly key: string;
  }[];
}

export type PhotoUploadOutcome =
  | { readonly ok: true; readonly photo: UploadedPhoto }
  | { readonly ok: false; readonly message: string };

const FAILED = "The photo could not be uploaded. Try again.";

function failure(message: string): PhotoUploadOutcome {
  return { ok: false, message };
}

async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { errors?: { form?: unknown } };
    return typeof body.errors?.form === "string" ? body.errors.form : FAILED;
  } catch {
    return FAILED;
  }
}

async function readPhoto(response: Response): Promise<PhotoUploadOutcome> {
  try {
    const body = (await response.json()) as Partial<UploadedPhoto>;
    if (typeof body.id === "string" && Array.isArray(body.variants)) {
      return { ok: true, photo: { id: body.id, variants: body.variants } };
    }
  } catch {
    // Fall through to the generic failure.
  }
  return failure(FAILED);
}

// The file is sent as the raw body; only the validation messages the upload
// endpoint intentionally returns are shown, never other server details.
export async function uploadPhotoRequest(
  file: File,
): Promise<PhotoUploadOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/admin/photos", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": file.type },
      body: file,
    });
  } catch {
    return failure(
      "The photo could not be uploaded. Check your connection and try again.",
    );
  }
  switch (response.status) {
    case 200:
      return readPhoto(response);
    case 413:
    case 422:
      return failure(await readMessage(response));
    case 401:
      return failure(
        "Your session could not be verified. Please sign in again.",
      );
    case 403:
      return failure("This account is not approved to upload photos.");
    case 503:
      return failure(
        "Photo uploads are unavailable right now. Try again later.",
      );
    default:
      return failure(FAILED);
  }
}
