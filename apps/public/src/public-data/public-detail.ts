import { createServerFn } from "@tanstack/react-start";
import { PublicReadError, type PublicShop } from "./public-reader";
import { serverPublicShopReader } from "./public-server";

export type PublicDetailData =
  | { readonly ok: true; readonly shop: PublicShop }
  | { readonly ok: false; readonly error: "not-found" | "unavailable" };

function validateInput(input: unknown): { readonly shopId: string } {
  if (
    typeof input !== "object" ||
    input === null ||
    typeof (input as { shopId?: unknown }).shopId !== "string" ||
    (input as { shopId: string }).shopId.trim() === ""
  ) {
    throw new Error("A shop ID is required.");
  }
  return { shopId: (input as { shopId: string }).shopId.trim() };
}

export const loadPublicShop = createServerFn({ method: "GET" })
  .validator(validateInput)
  .handler(async ({ data }): Promise<PublicDetailData> => {
    try {
      const shop = await serverPublicShopReader.get(data.shopId);
      return shop === null
        ? { ok: false, error: "not-found" }
        : { ok: true, shop };
    } catch (error) {
      if (error instanceof PublicReadError) {
        return { ok: false, error: "unavailable" };
      }
      throw error;
    }
  });
