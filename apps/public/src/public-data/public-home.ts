import { createServerFn } from "@tanstack/react-start";
import { PublicReadError, type PublicShop } from "./public-reader";
import { serverPublicShopReader } from "./public-server";

export type PublicHomeData =
  | { readonly ok: true; readonly shops: readonly PublicShop[] }
  | { readonly ok: false; readonly error: "unavailable" };

export const loadPublicShops = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicHomeData> => {
    try {
      return {
        ok: true,
        shops: await serverPublicShopReader.list(),
      };
    } catch (error) {
      if (error instanceof PublicReadError) {
        return { ok: false, error: "unavailable" };
      }
      throw error;
    }
  },
);
