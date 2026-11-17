import {
  SessionVerificationError,
  type SessionVerifier,
} from "../authentication/session";
import type { AccessRepository } from "../persistence/access-repository";
import { requireRequestPermission } from "./request";
import { AuthorizationError } from "./service";

export async function handleAccessCheck(
  repository: Pick<AccessRepository, "get">,
  verifier: SessionVerifier<Request>,
  request: Request,
): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    await requireRequestPermission(
      repository,
      verifier,
      request,
      "private:read",
    );
    return Response.json({ allowed: true }, { headers });
  } catch (error) {
    if (error instanceof SessionVerificationError) {
      return Response.json(
        { error: "unauthenticated" },
        { status: 401, headers },
      );
    }
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: error.reason },
        { status: error.reason === "unverifiable" ? 503 : 403, headers },
      );
    }
    throw error;
  }
}
