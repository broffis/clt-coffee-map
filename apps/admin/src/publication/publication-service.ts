import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import {
  publishShopLocation,
  republishShopDetails,
  unpublishLocation,
} from "../domain/publication";
import { validateShopPhotos } from "../domain/photo";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";
import { type PhotoDelivery, PhotoDeliveryError } from "../photos/delivery";
import type {
  PublicRegenerationRequest,
  PublicRegenerationTrigger,
} from "./public-regeneration";

export interface PublicationDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops" | "locations">;
  readonly verifier: SessionVerifier<Request>;
  readonly photoDelivery: PhotoDelivery;
  readonly publicRegeneration?: PublicRegenerationTrigger;
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
        | "republish-shop"
        | "retry-photo-delivery";
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
    action === "republish-shop" ||
    action === "retry-photo-delivery"
      ? action
      : null;
  const errors: PublicationErrors = {};

  if (shopId === "") {
    errors.shopId = "Choose a shop.";
  }
  if (
    locationId === "" &&
    publicationAction !== "republish-shop" &&
    publicationAction !== "retry-photo-delivery"
  ) {
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
    publicationAction !== "retry-photo-delivery" &&
    (location === null || location.shopId !== shop.id)
  ) {
    return { ok: false, errors: { form: "Shop or location not found." } };
  }

  if (publicationAction === "retry-photo-delivery") {
    const locations = await deps.repositories.locations.listByShop(shopId);
    if (
      shop.published === null ||
      !locations.some((item) => item.published !== null)
    ) {
      return {
        ok: false,
        errors: { form: "Publish a location before retrying photo delivery." },
      };
    }
  } else if (publicationAction === "republish-shop") {
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
  if (publicationAction !== "unpublish-location") {
    const currentShop = await deps.repositories.shops.get(shopId);
    const locations = await deps.repositories.locations.listByShop(shopId);
    if (
      currentShop?.published !== null &&
      currentShop?.published !== undefined &&
      locations.some((item) => item.published !== null)
    ) {
      try {
        const photos = currentShop.published.photos ?? [];
        validateShopPhotos(photos);
        for (const photo of photos) {
          for (const variant of photo.variants) {
            await deps.photoDelivery.copy(variant.key);
          }
        }
      } catch {
        throw new PhotoDeliveryError();
      }
    }
  }
  if (deps.publicRegeneration !== undefined) {
    const regeneration: PublicRegenerationRequest = {
      action:
        publicationAction === "retry-photo-delivery"
          ? "republish-shop"
          : publicationAction,
      shopId,
      ...(locationId === "" ? {} : { locationId }),
    };
    await deps.publicRegeneration.trigger(regeneration);
  }

  return {
    ok: true,
    action: publicationAction,
    shopId,
    ...(locationId === "" ? {} : { locationId }),
  };
}
