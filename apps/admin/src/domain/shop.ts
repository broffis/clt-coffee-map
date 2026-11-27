import { validateIdentifier } from "./identifiers";
import {
  type ContactLinks,
  copyContactLinks,
  validateContactLinks,
} from "./links";
import { copyShopPhotos, type ShopPhoto, validateShopPhotos } from "./photo";
import { copySources, type SourceReference, validateSources } from "./sources";

export interface ShopDetails {
  readonly name: string;
  readonly links: ContactLinks | null;
  readonly sources: readonly SourceReference<"name" | "links">[] | null;
  // Absent means no photos; kept optional so existing records stay valid.
  readonly photos?: readonly ShopPhoto[];
  readonly logoPhotoId?: string;
}

export interface Shop {
  readonly id: string;
  readonly draft: ShopDetails;
  readonly published: ShopDetails | null;
}

export function publishShopDetails(shop: Shop): Shop {
  validateIdentifier(shop.id, "Shop ID");
  if (shop.draft.name.trim().length === 0) {
    throw new RangeError("Shop name must not be blank.");
  }
  validateContactLinks(shop.draft.links);
  validateSources(shop.draft.sources, ["name", "links"]);
  if (shop.draft.photos !== undefined) {
    validateShopPhotos(shop.draft.photos);
  }
  if (
    shop.draft.logoPhotoId !== undefined &&
    !shop.draft.photos?.some((photo) => photo.id === shop.draft.logoPhotoId)
  ) {
    throw new RangeError("Choose a logo from the attached photos.");
  }

  return {
    ...shop,
    published: {
      ...shop.draft,
      links: copyContactLinks(shop.draft.links),
      sources: copySources(shop.draft.sources),
      ...(shop.draft.photos === undefined
        ? {}
        : { photos: copyShopPhotos(shop.draft.photos) }),
    },
  };
}
