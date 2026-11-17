import { beforeEach, describe, expect, it, vi } from "vitest";
import { clerkSessionVerifier } from "../src/authentication/clerk-server";
import { requireVerifiedSession } from "../src/authentication/session";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@clerk/tanstack-react-start/server", () => ({ auth }));

beforeEach(() => {
  auth.mockReset();
});

describe("Clerk middleware session verification", () => {
  it("uses only a session token verified by server middleware", async () => {
    auth.mockResolvedValue({
      isAuthenticated: true,
      userId: "user_verified",
    });

    await expect(
      requireVerifiedSession(
        clerkSessionVerifier,
        new Request("https://admin.example.test/?userId=user_other"),
      ),
    ).resolves.toEqual({ userId: "user_verified" });
    expect(auth).toHaveBeenCalledWith({ acceptsToken: "session_token" });
  });

  it("rejects a signed-out request", async () => {
    auth.mockResolvedValue({ isAuthenticated: false, userId: null });

    await expect(
      clerkSessionVerifier.verify(new Request("https://admin.example.test/")),
    ).resolves.toBeNull();
  });

  it("fails explicitly if the server middleware cannot verify the session", async () => {
    auth.mockRejectedValue(new Error("Middleware unavailable."));

    await expect(
      requireVerifiedSession(
        clerkSessionVerifier,
        new Request("https://admin.example.test/"),
      ),
    ).rejects.toThrow("Admin session could not be verified.");
  });
});
