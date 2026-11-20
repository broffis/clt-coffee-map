import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";
import { editorHeaders, respondToEditorError } from "./editor-response";

export interface EditorRecordsDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops" | "locations">;
  readonly verifier: SessionVerifier<Request>;
}

// Returns only draft fields in the form's own shape, for private admins.
export async function handleEditorRecords(
  deps: EditorRecordsDependencies,
  request: Request,
): Promise<Response> {
  try {
    await requireRequestPermission(
      deps.access,
      deps.verifier,
      request,
      "private:read",
    );
    const shops = await deps.repositories.shops.list();
    const records = await Promise.all(
      shops.map(async (shop) => ({
        id: shop.id,
        name: shop.draft.name,
        website: shop.draft.links?.website ?? "",
        photos: shop.draft.photos ?? [],
        published: shop.published !== null,
        locations: (await deps.repositories.locations.listByShop(shop.id)).map(
          ({ id, draft, published }) => ({
            id,
            published: published !== null,
            type: draft.type,
            streetLine1: draft.address?.streetLine1 ?? "",
            streetLine2: draft.address?.streetLine2 ?? "",
            postalCode: draft.address?.postalCode ?? "",
            latitude: draft.coordinates?.latitude.toString() ?? "",
            longitude: draft.coordinates?.longitude.toString() ?? "",
            website: draft.links?.website ?? "",
          }),
        ),
      })),
    );
    return Response.json({ shops: records }, { headers: editorHeaders });
  } catch (error) {
    return respondToEditorError(error);
  }
}
