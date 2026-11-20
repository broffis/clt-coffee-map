import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import type { AccessRepository } from "../persistence/access-repository";
import {
  MAX_UPLOAD_BYTES,
  type PhotoProcessingFailure,
  processPhoto,
} from "./processing";
import { type PhotoStorage, photoObjectKey } from "./storage";

export interface PhotoUploadDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly verifier: SessionVerifier<Request>;
  readonly storage: PhotoStorage;
  readonly newId: () => string;
}

export interface UploadedVariant {
  readonly width: number;
  readonly height: number;
  readonly key: string;
}

export type PhotoUploadResult =
  | {
      readonly ok: true;
      readonly id: string;
      readonly variants: readonly UploadedVariant[];
    }
  | {
      readonly ok: false;
      readonly code: PhotoProcessingFailure;
      readonly errors: { readonly form: string };
    };

const TOO_LARGE = "Photos must be 10 MB or smaller.";

function tooLarge(): PhotoUploadResult {
  return { ok: false, code: "too-large", errors: { form: TOO_LARGE } };
}

// Stops reading at the limit so an oversized body is never fully buffered.
async function readBody(request: Request): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get("Content-Length"));
  if (declared > MAX_UPLOAD_BYTES) {
    return null;
  }
  if (request.body === null) {
    return new Uint8Array();
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

// Authorization runs before the body is read. Variants are stored only after
// every one has been produced, and a partial storage failure removes whatever
// was written so no unreferenced objects remain.
export async function uploadPhoto(
  deps: PhotoUploadDependencies,
  request: Request,
): Promise<PhotoUploadResult> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "photo:upload",
  );
  const body = await readBody(request);
  if (body === null) {
    return tooLarge();
  }
  const processed = await processPhoto(body);
  if (!processed.ok) {
    return {
      ok: false,
      code: processed.code,
      errors: { form: processed.message },
    };
  }
  const id = deps.newId();
  const stored: UploadedVariant[] = [];
  try {
    for (const variant of processed.variants) {
      const key = photoObjectKey(id, variant.width);
      await deps.storage.put(key, variant.bytes, variant.contentType);
      stored.push({ width: variant.width, height: variant.height, key });
    }
  } catch (error) {
    await Promise.allSettled(
      processed.variants.map((variant) =>
        deps.storage.delete(photoObjectKey(id, variant.width)),
      ),
    );
    throw error;
  }
  return { ok: true, id, variants: stored };
}
