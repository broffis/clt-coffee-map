import sharp, { type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 50_000_000;
export const PHOTO_VARIANT_WIDTHS = [480, 960, 1600] as const;
const UNSUPPORTED_MESSAGE = "Use a JPEG, PNG, or WebP photo.";
const TOO_MANY_PIXELS_MESSAGE = "That photo has too many pixels.";
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export interface PhotoVariant {
  readonly width: number;
  readonly height: number;
  readonly contentType: "image/webp";
  readonly bytes: Uint8Array;
}

export type PhotoProcessingFailure =
  | "empty"
  | "too-large"
  | "unsupported"
  | "too-many-pixels"
  | "processing-failed";

export type PhotoProcessingResult =
  | { readonly ok: true; readonly variants: readonly PhotoVariant[] }
  | {
      readonly ok: false;
      readonly code: PhotoProcessingFailure;
      readonly message: string;
    };

function isPixelLimit(error: unknown): boolean {
  return error instanceof Error && /pixel limit/i.test(error.message);
}

function failure(
  code: PhotoProcessingFailure,
  message: string,
): PhotoProcessingResult {
  return { ok: false, code, message };
}

// Validation uses the decoded image, not the client-declared type. Output is
// always re-encoded so metadata (EXIF, GPS) never reaches public storage.
export async function processPhoto(
  input: Uint8Array,
): Promise<PhotoProcessingResult> {
  if (input.byteLength === 0) {
    return failure("empty", "Choose a photo to upload.");
  }
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    return failure("too-large", "Photos must be 10 MB or smaller.");
  }
  let meta: Metadata;
  try {
    meta = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch (error) {
    return isPixelLimit(error)
      ? failure("too-many-pixels", TOO_MANY_PIXELS_MESSAGE)
      : failure("unsupported", UNSUPPORTED_MESSAGE);
  }
  if (meta.format === undefined || !ALLOWED_FORMATS.has(meta.format)) {
    return failure("unsupported", UNSUPPORTED_MESSAGE);
  }
  try {
    // Orientation swaps the displayed width and height for 5 to 8.
    const swapped = (meta.orientation ?? 1) >= 5;
    const width = (swapped ? meta.height : meta.width) ?? 0;
    const fitting = PHOTO_VARIANT_WIDTHS.filter((target) => target <= width);
    const widths = fitting.length > 0 ? fitting : [width];
    const variants: PhotoVariant[] = [];
    for (const target of widths) {
      const { data, info } = await sharp(input, {
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      variants.push({
        width: info.width,
        height: info.height,
        contentType: "image/webp",
        bytes: new Uint8Array(data),
      });
    }
    return { ok: true, variants };
  } catch {
    return failure("processing-failed", "The photo could not be processed.");
  }
}
