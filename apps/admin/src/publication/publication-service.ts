import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import {
  publishShopLocation,
  republishShopDetails,
  unpublishLocation,
} from "../domain/publication";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";

export interface PublicationDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops" | "locations">;
  readonly verifier: SessionVerifier<Request>;
}

export type PublicationErrors = Partial<
  Record<"form" | "shopId" | "locationId" | "action", string>
>;

export type PublicationResult =
  | {
      readonly ok: true;
      readonly action:
        | "publish-location"
        | "unpublish-location"
        | "republish-shop";
      readonly shopId: string;
      readonly locationId?: string;
    }
  | { readonly ok: false; readonly errors: PublicationErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function updatePublication(
  deps: PublicationDependencies,
  request: Request,
  input: unknown,
): Promise<PublicationResult> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "shop:publish",
  );

  if (typeof input !== "object" || input === null) {
    return {
      ok: false,
      errors: { form: "Submitted publication data is not valid." },
    };
  }

  const fields = input as Record<string, unknown>;
  const shopId = text(fields.shopId);
  const locationId = text(fields.locationId);
  const action = text(fields.action);
  const publicationAction =
    action === "publish-location" ||
    action === "unpublish-location" ||
    action === "republish-shop"
      ? action
      : null;
  const errors: PublicationErrors = {};

  if (shopId === "") {
    errors.shopId = "Choose a shop.";
  }
  if (locationId === "" && publicationAction !== "republish-shop") {
    errors.locationId = "Choose a location.";
  }
  if (publicationAction === null) {
    errors.action = "Choose a valid publication action.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  if (publicationAction === null) {
    return { ok: false, errors };
  }

  const shop = await deps.repositories.shops.get(shopId);
  const location =
    locationId === ""
      ? null
      : await deps.repositories.locations.get(locationId);
  if (shop === null) {
    return { ok: false, errors: { form: "Shop or location not found." } };
  }
  if (
    publicationAction !== "republish-shop" &&
    (location === null || location.shopId !== shop.id)
  ) {
    return { ok: false, errors: { form: "Shop or location not found." } };
  }

  if (publicationAction === "republish-shop") {
    if (shop.published === null) {
      return {
        ok: false,
        errors: {
          form: "Publish a location before republishing shop details.",
        },
      };
    }
    let updatedShop: ReturnType<typeof republishShopDetails>;
    try {
      updatedShop = republishShopDetails(shop);
    } catch (error) {
      if (error instanceof RangeError) {
        return { ok: false, errors: { form: error.message } };
      }
      throw error;
    }
    await deps.repositories.shops.save(updatedShop);
  } else if (publicationAction === "publish-location") {
    if (location === null) {
      return { ok: false, errors: { form: "Shop or location not found." } };
    }
    let result: ReturnType<typeof publishShopLocation>;
    try {
      result = publishShopLocation(shop, location);
    } catch (error) {
      if (error instanceof RangeError) {
        return { ok: false, errors: { form: error.message } };
      }
      throw error;
    }
    await deps.repositories.shops.save(result.shop);
    await deps.repositories.locations.save(result.location);
  } else {
    if (location === null) {
      return { ok: false, errors: { form: "Shop or location not found." } };
    }
    await deps.repositories.locations.save(unpublishLocation(location));
  }

  return {
    ok: true,
    action: publicationAction,
    shopId,
    ...(locationId === "" ? {} : { locationId }),
  };
}
