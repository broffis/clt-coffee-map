import { createFileRoute } from "@tanstack/react-router";
import { clerkSessionVerifier } from "../authentication/clerk-server";
import {
  handleCandidateAction,
  handleCandidateList,
} from "../candidates/candidate-handler";
import { readRegionDefaults } from "../editor/region-defaults";
import { serverAccessReader } from "../persistence/access-server";
import { serverCandidateRepository } from "../persistence/candidate-server";
import { serverEditorRepositories } from "../persistence/editor-server";

const dependencies = {
  access: serverAccessReader,
  candidates: serverCandidateRepository,
  repositories: serverEditorRepositories,
  verifier: clerkSessionVerifier,
  get defaults() {
    return readRegionDefaults(process.env);
  },
  newShopId: () => crypto.randomUUID(),
  newLocationId: () => crypto.randomUUID(),
  now: () => new Date(),
};

export const Route = createFileRoute("/api/admin/candidates")({
  server: {
    handlers: {
      GET: ({ request }) => handleCandidateList(dependencies, request),
      POST: ({ request }) => handleCandidateAction(dependencies, request),
    },
  },
});
