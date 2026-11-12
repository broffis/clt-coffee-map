export interface ShopDetails {
  readonly name: string;
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

  return { ...shop, published: { ...shop.draft } };
}
