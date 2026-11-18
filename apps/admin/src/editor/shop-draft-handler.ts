import { SessionVerificationError } from "../authentication/session";
import { AuthorizationError } from "../authorization/service";
import { PersistenceError } from "../persistence/errors";
import {
  type ShopDraftDependencies,
  saveShopDraft,
} from "./shop-draft-service";

const headers = { "Cache-Control": "private, no-store" };
const invalidForm = {
  ok: false,
  errors: { form: "Submitted shop data is not valid." },
};

export async function handleShopDraftSave(
  deps: ShopDraftDependencies,
  request: Request,
): Promise<Response> {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      // Authorize first so unauthenticated callers cannot probe parsing.
      input = undefined;
    }
    const result = await saveShopDraft(
      deps,
      request,
      input === undefined ? null : input,
    );
    if (result.ok) {
      return Response.json(result, { headers });
    }
    const malformed = input === undefined;
    return Response.json(malformed ? invalidForm : result, {
      status: malformed ? 400 : 422,
      headers,
    });
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
    if (error instanceof PersistenceError) {
      return Response.json({ error: "unavailable" }, { status: 503, headers });
    }
    throw error;
  }
}
