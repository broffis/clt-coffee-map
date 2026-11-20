import type { PublicJsonObject } from "./public-data/public-reader";

export interface PublicPhoto {
  readonly id: string;
  readonly alt: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly srcSet: string;
}

// Read at call time so the delivery origin stays a deployment setting. Photos
// are omitted, not broken, when it is missing or not HTTPS.
export function publicPhotoBaseUrl(): string | null {
  const value = import.meta.env.VITE_PUBLIC_PHOTO_BASE_URL?.trim() ?? "";
  if (!URL.canParse(value) || new URL(value).protocol !== "https:") {
    return null;
  }
  return value.replace(/\/+$/, "");
}

const PHOTO_KEY = /^photos\/[A-Za-z0-9_-]+\/\d+\.webp$/;

interface Variant {
  readonly width: number;
  readonly height: number;
  readonly url: string;
}

function readVariants(value: unknown, base: string): Variant[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const variants: Variant[] = [];
  for (const item of value) {
    const { width, height, key } = (item ?? {}) as Record<string, unknown>;
    if (
      Number.isInteger(width) &&
      (width as number) > 0 &&
      Number.isInteger(height) &&
      (height as number) > 0 &&
      typeof key === "string" &&
      PHOTO_KEY.test(key)
    ) {
      variants.push({
        width: width as number,
        height: height as number,
        url: `${base}/${key}`,
      });
    }
  }
  return variants.sort((a, b) => a.width - b.width);
}

// Published JSON is untrusted at render time: anything malformed is skipped so
// one bad photo never hides the shop.
export function readPublicPhotos(
  details: PublicJsonObject,
  base: string | null,
): PublicPhoto[] {
  if (base === null || !Array.isArray(details.photos)) {
    return [];
  }
  const photos: PublicPhoto[] = [];
  for (const item of details.photos) {
    const { id, alt, variants } = (item ?? {}) as Record<string, unknown>;
    const sources = readVariants(variants, base);
    const largest = sources.at(-1);
    if (
      typeof id !== "string" ||
      typeof alt !== "string" ||
      alt.trim() === "" ||
      largest === undefined
    ) {
      continue;
    }
    photos.push({
      id,
      alt,
      src: largest.url,
      width: largest.width,
      height: largest.height,
      srcSet: sources.map((v) => `${v.url} ${v.width}w`).join(", "),
    });
  }
  return photos;
}
