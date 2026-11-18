import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import type { ShopDetails } from "../domain/shop";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";

export interface ShopDraftDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops">;
  readonly verifier: SessionVerifier<Request>;
}

export type ShopDraftErrors = Partial<
  Record<"form" | "id" | "name" | "website", string>
>;

export type ShopDraftResult =
  | { readonly ok: true }
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
  const id = text(fields.id).trim();
  const name = text(fields.name).trim();
  const website = text(fields.website).trim();
  const errors: ShopDraftErrors = {};
  if (id === "") {
    errors.id = "Shop ID must not be blank.";
  }
  if (name === "") {
    errors.name = "Shop name must not be blank.";
  }
  if (website !== "" && !isHttpsUrl(website)) {
    errors.website = "Website URL must be a valid HTTPS URL.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  const existing = await deps.repositories.shops.get(id);
  const draft: ShopDetails = {
    name,
    links: website === "" ? null : { website, other: [] },
    sources: existing?.draft.sources ?? null,
  };
  await deps.repositories.shops.save({
    id,
    draft,
    published: existing?.published ?? null,
  });
  return { ok: true };
}
