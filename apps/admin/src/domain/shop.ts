import { type ContactLinks, copyContactLinks } from "./links";
import { copySources, type SourceReference } from "./sources";

export interface ShopDetails {
  readonly name: string;
  readonly links: ContactLinks | null;
  readonly sources: readonly SourceReference<"name" | "links">[] | null;
}

export interface Shop {
  readonly id: string;
  readonly draft: ShopDetails;
  readonly published: ShopDetails | null;
}

export function publishShopDetails(shop: Shop): Shop {
  if (shop.draft.name.trim().length === 0) {
    throw new RangeError("Shop name must not be blank.");
  }

  return {
    ...shop,
    published: {
      ...shop.draft,
      links: copyContactLinks(shop.draft.links),
      sources: copySources(shop.draft.sources),
    },
  };
}
