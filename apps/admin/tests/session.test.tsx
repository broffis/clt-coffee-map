import { describe, expect, it } from "vitest";
import {
  createClerkSessionVerifier,
  SessionVerificationError,
  requireVerifiedSession,
  type SessionVerifier,
} from "../src/authentication/session";

type TestRequest = {
  readonly headers: Headers;
  readonly clientUserId?: string;
};

describe("server session boundary", () => {
  it("maps an authenticated Clerk request to its server-verified user ID", async () => {
    const verifier = createClerkSessionVerifier({
      authenticateRequest: async () => ({
        isAuthenticated: true,
        toAuth: () => ({ userId: "user_clerk" }),
      }),
    });

    await expect(
      verifier.verify(new Request("https://admin.example.test")),
    ).resolves.toEqual({ userId: "user_clerk" });
  });

  it("does not accept an unauthenticated Clerk request", async () => {
    const verifier = createClerkSessionVerifier({
      authenticateRequest: async () => ({
        isAuthenticated: false,
        toAuth: () => ({ userId: null }),
      }),
    });

    await expect(
      verifier.verify(new Request("https://admin.example.test")),
    ).resolves.toBeNull();
  });

  it("uses the verifier result rather than a client-supplied user ID", async () => {
    const verifier: SessionVerifier<TestRequest> = {
      verify: async () => ({ userId: "user_verified" }),
    };

    await expect(
      requireVerifiedSession(verifier, {
        headers: new Headers(),
        clientUserId: "user_attacker",
      }),
    ).resolves.toEqual({ userId: "user_verified" });
  });

  it("rejects requests without a verified session", async () => {
    const verifier: SessionVerifier<TestRequest> = {
      verify: async () => null,
    };

    await expect(
      requireVerifiedSession(verifier, {
        headers: new Headers(),
      }),
    ).rejects.toEqual(
      new SessionVerificationError("No verified admin session was found."),
    );
  });

  it("rejects an invalid identity returned by a verifier", async () => {
    const verifier: SessionVerifier<TestRequest> = {
      verify: async () => ({ userId: " " }),
    };

    await expect(
      requireVerifiedSession(verifier, {
        headers: new Headers(),
      }),
    ).rejects.toThrow("No verified admin session was found.");
  });

  it("surfaces verifier failure as an explicit verification error", async () => {
    const verifier: SessionVerifier<TestRequest> = {
      verify: async () => {
        throw new Error("provider unavailable");
      },
    };

    await expect(
      requireVerifiedSession(verifier, {
        headers: new Headers(),
      }),
    ).rejects.toEqual(
      new SessionVerificationError("Admin session could not be verified."),
    );
  });
});
