import { SessionVerificationError } from "../authentication/session";
import { AuthorizationError } from "../authorization/service";
import { PersistenceError } from "../persistence/errors";
import {
  type CandidateDependencies,
  listPendingCandidates,
  reviewCandidate,
  stageCandidates,
} from "./candidate-service";

const headers = { "Cache-Control": "private, no-store" };

function errorResponse(error: unknown): Response {
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
  if (error instanceof PersistenceError) {
    return Response.json({ error: "unavailable" }, { status: 503, headers });
  }
  if (error instanceof RangeError) {
    return Response.json(
      { ok: false, errors: { form: error.message } },
      { status: 422, headers },
    );
  }
  throw error;
}

export async function handleCandidateList(
  deps: CandidateDependencies,
  request: Request,
): Promise<Response> {
  try {
    return Response.json(
      { candidates: await listPendingCandidates(deps, request) },
      { headers },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleCandidateAction(
  deps: CandidateDependencies,
  request: Request,
): Promise<Response> {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return Response.json(
        {
          ok: false,
          errors: { form: "Submitted candidate data is not valid." },
        },
        { status: 400, headers },
      );
    }
    if (
      typeof input !== "object" ||
      input === null ||
      typeof (input as { action?: unknown }).action !== "string"
    ) {
      return Response.json(
        { ok: false, errors: { action: "Choose a valid candidate action." } },
        { status: 422, headers },
      );
    }
    const action = (input as { action: string }).action;
    const result =
      action === "stage"
        ? await stageCandidates(
            deps,
            request,
            (input as { candidates?: unknown }).candidates,
          )
        : action === "review"
          ? await reviewCandidate(deps, request, input)
          : {
              ok: false as const,
              errors: { action: "Choose a valid candidate action." },
            };
    return Response.json(result, {
      status: result.ok ? 200 : 422,
      headers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
