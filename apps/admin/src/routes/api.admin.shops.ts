import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { handleEditorRecords } from "../editor/editor-records";
import { handleShopDraftSave } from "../editor/shop-draft-handler";
import { serverAccessReader } from "../persistence/access-server";
import { serverEditorRepositories } from "../persistence/editor-server";

const dependencies = {
  access: serverAccessReader,
  repositories: serverEditorRepositories,
  verifier: clerkSessionVerifier,
};

export const Route = createFileRoute("/api/admin/shops")({
  server: {
    handlers: {
      GET: ({ request }) => handleEditorRecords(dependencies, request),
      POST: ({ request }) =>
        handleShopDraftSave(
          { ...dependencies, newId: () => crypto.randomUUID() },
          request,
        ),
    },
  },
});
