import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { serverAccessReader } from "../persistence/access-server";
import { serverEditorRepositories } from "../persistence/editor-server";
import { createPublicRegenerationTrigger } from "../publication/public-regeneration";
import { handlePublicationUpdate } from "../publication/publication-handler";

const dependencies = {
  access: serverAccessReader,
  repositories: serverEditorRepositories,
  verifier: clerkSessionVerifier,
  publicRegeneration: createPublicRegenerationTrigger(process.env),
};

export const Route = createFileRoute("/api/admin/publication")({
  server: {
    handlers: {
      POST: ({ request }) => handlePublicationUpdate(dependencies, request),
    },
  },
});
