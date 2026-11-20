import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { serverAccessReader } from "../persistence/access-server";
import { serverPhotoStorage } from "../photos/storage-server";
import { handlePhotoUpload } from "../photos/upload-handler";

export const Route = createFileRoute("/api/admin/photos")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handlePhotoUpload(
          {
            access: serverAccessReader,
            verifier: clerkSessionVerifier,
            storage: serverPhotoStorage,
            newId: () => crypto.randomUUID(),
          },
          request,
        ),
    },
  },
});
