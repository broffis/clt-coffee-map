import { photoObjectKey } from "../photos/storage";
import { validateIdentifier } from "./identifiers";

export interface ShopPhotoVariant {
  readonly width: number;
  readonly height: number;
  readonly key: string;
}

export interface ShopPhoto {
  readonly id: string;
  readonly alt: string;
  readonly variants: readonly ShopPhotoVariant[];
}

export function validateShopPhotos(photos: readonly ShopPhoto[]): void {
  const ids = new Set<string>();
  for (const photo of photos) {
    validateIdentifier(photo.id, "Photo ID");
    if (ids.has(photo.id)) {
      throw new RangeError("Photo IDs must not contain duplicates.");
    }
    ids.add(photo.id);
    if (photo.alt.trim().length === 0) {
      throw new RangeError("Photo alternative text must not be blank.");
    }
    validateVariants(photo);
  }
}

// Keys are derived from the photo ID, so a record can never reference an
// object outside its own photo prefix.
function validateVariants(photo: ShopPhoto): void {
  if (photo.variants.length === 0) {
    throw new RangeError("Each photo needs at least one variant.");
  }
  const widths = new Set<number>();
  for (const variant of photo.variants) {
    if (!Number.isInteger(variant.width) || variant.width <= 0) {
      throw positiveError();
    }
    if (!Number.isInteger(variant.height) || variant.height <= 0) {
      throw positiveError();
    }
    if (widths.has(variant.width)) {
      throw new RangeError("Photo variant widths must be unique.");
    }
    widths.add(variant.width);
    if (variant.key !== photoObjectKey(photo.id, variant.width)) {
      throw new RangeError("Photo variant key must match its photo and width.");
    }
  }
}

function positiveError(): RangeError {
  return new RangeError(
    "Photo variant dimensions must be positive whole numbers.",
  );
}

export function copyShopPhotos(photos: readonly ShopPhoto[]): ShopPhoto[] {
  return photos.map((photo) => ({
    ...photo,
    variants: photo.variants.map((variant) => ({ ...variant })),
  }));
}
