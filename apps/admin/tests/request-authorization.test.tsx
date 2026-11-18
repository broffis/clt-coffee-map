import { describe, expect, it, vi } from "vitest";
import {
  SessionVerificationError,
  type SessionVerifier,
} from "../src/authentication/session";
import { requireRequestPermission } from "../src/authorization/request";
import { AuthorizationError } from "../src/authorization/service";
import {
  approveAccess,
  blockAccess,
  createOwnerAccess,
  revokeAccess,
} from "../src/domain/access";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { PersistenceError } from "../src/persistence/errors";

const NOW = new Date("2026-11-17T20:00:00.000Z");
const request = new Request("https://admin.example.test/");
const verifier: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

describe("request authorization", () => {
  it("allows an approved session only for actions its role permits", async () => {
    const repository = createInMemoryAccessRepository();
    const editor = approveAccess(null, "user_editor", NOW);
    await repository.save(editor);

    await expect(
      requireRequestPermission(repository, verifier, request, "shop:edit"),
    ).resolves.toEqual(editor);
    await expect(
      requireRequestPermission(repository, verifier, request, "access:manage"),
    ).rejects.toEqual(new AuthorizationError("forbidden"));
  });

  it("denies an unapproved session despite client-supplied owner identity", async () => {
    const repository = createInMemoryAccessRepository();
    await repository.save(createOwnerAccess("user_owner", NOW));
    const spoofedRequest = new Request(
      "https://admin.example.test/?userId=user_owner",
      { headers: { "x-user-id": "user_owner" } },
    );

    await expect(
      requireRequestPermission(
        repository,
        verifier,
        spoofedRequest,
        "private:read",
      ),
    ).rejects.toEqual(new AuthorizationError("no-access"));
    expect(await repository.get("user_editor")).toBeNull();
  });

  it.each(["revoked", "blocked"] as const)(
    "denies an existing session on the next request after access is %s",
    async (status) => {
      const repository = createInMemoryAccessRepository();
      const editor = approveAccess(null, "user_editor", NOW);
      await repository.save(editor);
      await requireRequestPermission(
        repository,
        verifier,
        request,
        "private:read",
      );

      await repository.save(
        status === "revoked"
          ? revokeAccess(editor, NOW)
          : blockAccess(editor, editor.userId, NOW),
      );

      await expect(
        requireRequestPermission(repository, verifier, request, "private:read"),
      ).rejects.toEqual(new AuthorizationError(status));
    },
  );

  it("does not read permissions without a verified session", async () => {
    const repository = createInMemoryAccessRepository();
    const read = vi.spyOn(repository, "get");
    const signedOut: SessionVerifier<Request> = { verify: async () => null };

    await expect(
      requireRequestPermission(repository, signedOut, request, "private:read"),
    ).rejects.toBeInstanceOf(SessionVerificationError);
    expect(read).not.toHaveBeenCalled();
  });

  it("denies a verified session when its permissions cannot be read", async () => {
    const repository = createInMemoryAccessRepository();
    vi.spyOn(repository, "get").mockRejectedValue(
      new PersistenceError("unavailable", "Database operation failed."),
    );

    await expect(
      requireRequestPermission(repository, verifier, request, "private:read"),
    ).rejects.toEqual(new AuthorizationError("unverifiable"));
  });
});
