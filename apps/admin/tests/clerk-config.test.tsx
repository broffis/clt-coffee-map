import { describe, expect, it } from "vitest";
import { readAuthorizedParties } from "../src/authentication/clerk-config";

describe("Clerk authorized parties", () => {
  it("allows only the two local admin origins during development", () => {
    expect(readAuthorizedParties({ NODE_ENV: "development" })).toEqual([
      "http://127.0.0.1:3001",
      "http://localhost:3001",
    ]);
  });

  it("requires an explicit origin outside development", () => {
    expect(() => readAuthorizedParties({ NODE_ENV: "production" })).toThrow(
      "ADMIN_ORIGIN must be an HTTP(S) origin.",
    );
    expect(
      readAuthorizedParties({ ADMIN_ORIGIN: "https://admin.example.test" }),
    ).toEqual(["https://admin.example.test"]);
  });

  it.each([
    "https://admin.example.test/path",
    "https://admin.example.test?query=1",
    "https://admin.example.test#fragment",
    "https://user:password@admin.example.test",
    "file:///tmp/admin",
    "not-an-origin",
  ])("rejects a non-origin value without echoing it: %s", (origin) => {
    expect(() => readAuthorizedParties({ ADMIN_ORIGIN: origin })).toThrow(
      "ADMIN_ORIGIN must be an HTTP(S) origin.",
    );
  });
});
