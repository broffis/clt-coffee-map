import { publicCacheControl, publicFailureCacheControl } from "./cache-policy";
import { PublicReadError, type PublicShopReader } from "./public-reader";

export interface PublicReadDependencies {
  readonly reader: PublicShopReader;
}

const successHeaders = {
  "Cache-Control": publicCacheControl,
};
const failureHeaders = { "Cache-Control": publicFailureCacheControl };

export async function handlePublicShops(
  deps: PublicReadDependencies,
): Promise<Response> {
  try {
    return Response.json(
      { shops: await deps.reader.list() },
      { headers: successHeaders },
    );
  } catch (error) {
    if (error instanceof PublicReadError) {
      return Response.json(
        { error: "unavailable" },
        { status: 503, headers: failureHeaders },
      );
    }
    throw error;
  }
}
