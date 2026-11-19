import { SessionVerificationError } from "../authentication/session";
import { AuthorizationError } from "../authorization/service";
import { PersistenceError } from "../persistence/errors";

const headers = { "Cache-Control": "private, no-store" };

type SaveResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly errors: unknown };

export function respondToEditorError(error: unknown): Response {
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
  throw error;
}

// Shared HTTP mapping for editor writes. The save callback authorizes first,
// so unauthenticated callers cannot probe body parsing.
export async function respondToEditorWrite(
  request: Request,
  save: (input: unknown) => Promise<SaveResult>,
): Promise<Response> {
  try {
    let input: unknown;
    let malformed = false;
    try {
      input = await request.json();
    } catch {
      malformed = true;
      input = null;
    }
    const result = await save(input);
    if (result.ok) {
      return Response.json(result, { headers });
    }
    return Response.json(result, {
      status: malformed ? 400 : 422,
      headers,
    });
  } catch (error) {
    return respondToEditorError(error);
  }
}

export const editorHeaders = headers;
