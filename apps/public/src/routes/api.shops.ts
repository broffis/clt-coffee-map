import { createFileRoute } from "@tanstack/react-router";
import { handlePublicShops } from "../public-data/public-handler";
import { serverPublicShopReader } from "../public-data/public-server";

export const Route = createFileRoute("/api/shops")({
  server: {
    handlers: {
      GET: () => handlePublicShops({ reader: serverPublicShopReader }),
    },
  },
});
