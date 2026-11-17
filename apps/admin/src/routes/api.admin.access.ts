import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import { handleAccessCheck } from "../authorization/access-check";
import { serverAccessReader } from "../persistence/access-server";

export const Route = createFileRoute("/api/admin/access")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleAccessCheck(serverAccessReader, clerkSessionVerifier, request),
    },
  },
});
