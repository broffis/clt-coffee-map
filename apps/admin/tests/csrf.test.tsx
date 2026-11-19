import { describe, expect, it } from "vitest";
import { requiresCsrfCheck } from "../src/security/csrf";

function context(handlerType: "serverFn" | "router", method: string) {
  return {
    handlerType,
    request: new Request("https://admin.example.test/api/admin/shops", {
      method,
    }),
  };
}

describe("CSRF check selection", () => {
  it("checks every server function", () => {
    expect(requiresCsrfCheck(context("serverFn", "POST"))).toBe(true);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "checks state-changing %s route handlers",
    (method) => {
      expect(requiresCsrfCheck(context("router", method))).toBe(true);
    },
  );

  it.each(["GET", "HEAD", "OPTIONS"])(
    "skips safe %s route requests",
    (method) => {
      expect(requiresCsrfCheck(context("router", method))).toBe(false);
    },
  );
});
