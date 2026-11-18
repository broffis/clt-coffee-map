import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { handleShopDraftSave } from "../editor/shop-draft-handler";
import { serverAccessReader } from "../persistence/access-server";
import { serverEditorRepositories } from "../persistence/editor-server";

export const Route = createFileRoute("/api/admin/shops")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleShopDraftSave(
          {
            access: serverAccessReader,
            repositories: serverEditorRepositories,
            verifier: clerkSessionVerifier,
            newId: () => crypto.randomUUID(),
          },
          request,
        ),
    },
  },
});
