import { describe, expect, it, vi } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { handleAccessCheck } from "../src/authorization/access-check";
import { approveAccess } from "../src/domain/access";
import { PersistenceError } from "../src/persistence/errors";

const request = new Request("https://admin.example.test/api/admin/access");
const verified: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_verified" }),
};

describe("private access-check endpoint", () => {
  it("returns only an access confirmation for an approved session", async () => {
    const record = approveAccess(null, "user_verified", new Date());
    const response = await handleAccessCheck(
      { get: async () => record },
      verified,
      request,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ allowed: true });
  });

  it("returns 401 without reading private data for an unsigned request", async () => {
    const get = vi.fn();
    const response = await handleAccessCheck(
      { get },
      { verify: async () => null },
      request,
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 403 for a valid session without approval", async () => {
    const response = await handleAccessCheck(
      { get: async () => null },
      verified,
      request,
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "no-access" });
  });

  it("returns 503 instead of pretending missing persistence means no approval", async () => {
    const response = await handleAccessCheck(
      {
        get: async () => {
          throw new PersistenceError(
            "configuration",
            "MONGODB_URI must be set.",
          );
        },
      },
      verified,
      request,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "unverifiable" });
  });
});
