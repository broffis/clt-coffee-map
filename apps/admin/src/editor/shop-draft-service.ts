import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import { type ShopPhoto, validateShopPhotos } from "../domain/photo";
import type { ShopDetails } from "../domain/shop";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";
import type { PhotoStorage } from "../photos/storage";

export interface ShopDraftDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops">;
  readonly storage: PhotoStorage;
  readonly verifier: SessionVerifier<Request>;
  readonly newId: () => string;
}

export type ShopDraftErrors = Partial<
  Record<"form" | "name" | "photos" | "logoPhotoId" | "website", string>
>;

export type ShopDraftResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly errors: ShopDraftErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const NOT_UPLOADED = "Photos must be uploaded before they are attached.";

function parseVariants(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseNewVariants(value: unknown): ShopPhoto["variants"] {
  return parseVariants(value).map((item) => {
    const variant = (
      typeof item === "object" && item !== null ? item : {}
    ) as Record<string, unknown>;
    return {
      width: Number(variant.width),
      height: Number(variant.height),
      key: text(variant.key),
    };
  });
}

// Stored photos keep their server-held variants and only take new alt text;
// unknown IDs must carry variants that validate and exist in storage, so a
// client can never reference objects the server did not write.
async function resolvePhotos(
  storage: PhotoStorage,
  raw: unknown,
  stored: readonly ShopPhoto[],
): Promise<{ readonly photos: ShopPhoto[] } | { readonly error: string }> {
  if (!Array.isArray(raw)) {
    return { error: "Photos must be a list." };
  }
  const known = new Map(stored.map((photo) => [photo.id, photo]));
  const photos: ShopPhoto[] = raw.map((item) => {
    const photo = (
      typeof item === "object" && item !== null ? item : {}
    ) as Record<string, unknown>;
    const id = text(photo.id).trim();
    const current = known.get(id);
    return {
      id,
      alt: text(photo.alt).trim(),
      variants: current?.variants ?? parseNewVariants(photo.variants),
    };
  });
  try {
    validateShopPhotos(photos);
  } catch (error) {
    return { error: (error as RangeError).message };
  }
  for (const photo of photos) {
    if (known.has(photo.id)) {
      continue;
    }
    for (const variant of photo.variants) {
      if (!(await storage.exists(variant.key))) {
        return { error: NOT_UPLOADED };
      }
    }
  }
  return { photos };
}

// Orphaned objects are harmless and can be swept later, so a failed delete
// must not fail an already persisted save.
async function deleteRemovedPhotos(
  storage: PhotoStorage,
  before: readonly ShopPhoto[],
  kept: readonly ShopPhoto[],
  published: readonly ShopPhoto[],
): Promise<void> {
  const inUse = new Set([...kept, ...published].map((photo) => photo.id));
  for (const photo of before) {
    if (inUse.has(photo.id)) {
      continue;
    }
    for (const variant of photo.variants) {
      await storage.delete(variant.key).catch(() => undefined);
    }
  }
}

// Authorization runs before any parsing so unauthorized callers learn nothing
// about validation rules. Drafts never touch the published copy.
export async function saveShopDraft(
  deps: ShopDraftDependencies,
  request: Request,
  input: unknown,
): Promise<ShopDraftResult> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "shop:edit",
  );
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { form: "Submitted shop data is not valid." } };
  }
  const fields = input as Record<string, unknown>;
  const requestedId = text(fields.id).trim();
  const name = text(fields.name).trim();
  const website = text(fields.website).trim();
  const errors: ShopDraftErrors = {};
  if (name === "") {
    errors.name = "Shop name must not be blank.";
  }
  if (website !== "" && !isHttpsUrl(website)) {
    errors.website = "Website URL must be a valid HTTPS URL.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  // Only the server mints IDs; a supplied ID may only edit an existing shop.
  const existing =
    requestedId === "" ? null : await deps.repositories.shops.get(requestedId);
  if (requestedId !== "" && existing === null) {
    return { ok: false, errors: { form: "Shop not found." } };
  }
  const stored = existing?.draft.photos ?? [];
  let photos = stored;
  if (fields.photos !== undefined) {
    const resolved = await resolvePhotos(deps.storage, fields.photos, stored);
    if ("error" in resolved) {
      return { ok: false, errors: { photos: resolved.error } };
    }
    photos = resolved.photos;
  }
  if (
    fields.logoPhotoId !== undefined &&
    fields.logoPhotoId !== null &&
    typeof fields.logoPhotoId !== "string"
  ) {
    return {
      ok: false,
      errors: { logoPhotoId: "Choose a logo from the attached photos." },
    };
  }
  const logoPhotoId =
    fields.logoPhotoId === undefined
      ? existing?.draft.logoPhotoId
      : text(fields.logoPhotoId).trim() || undefined;
  const logoExists = photos.some((photo) => photo.id === logoPhotoId);
  if (fields.logoPhotoId !== undefined && logoPhotoId && !logoExists) {
    return {
      ok: false,
      errors: { logoPhotoId: "Choose a logo from the attached photos." },
    };
  }
  const id = existing?.id ?? deps.newId();
  const draft: ShopDetails = {
    name,
    links: website === "" ? null : { website, other: [] },
    sources: existing?.draft.sources ?? null,
    ...(photos.length > 0 ? { photos } : {}),
    ...(logoExists && logoPhotoId !== undefined ? { logoPhotoId } : {}),
  };
  await deps.repositories.shops.save({
    id,
    draft,
    published: existing?.published ?? null,
  });
  await deleteRemovedPhotos(
    deps.storage,
    stored,
    photos,
    existing?.published?.photos ?? [],
  );
  return { ok: true, id };
}
