import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { handleLocationDraftSave } from "../editor/location-draft-handler";
import { readRegionDefaults } from "../editor/region-defaults";
import { serverAccessReader } from "../persistence/access-server";
import { serverEditorRepositories } from "../persistence/editor-server";

export const Route = createFileRoute("/api/admin/locations")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleLocationDraftSave(
          {
            access: serverAccessReader,
            repositories: serverEditorRepositories,
            verifier: clerkSessionVerifier,
            newId: () => crypto.randomUUID(),
            // Read only when a location is created, so a missing setting
            // surfaces as a 503 from the handler.
            get defaults() {
              return readRegionDefaults(process.env);
            },
          },
          request,
        ),
    },
  },
});
