import { describe, expect, it } from "vitest";
import type { AdminAccess } from "../src/domain/access";
import {
  ADMIN_ACTIONS,
  type AdminAction,
  can,
} from "../src/domain/permissions";

function access(
  role: AdminAccess["role"],
  status: AdminAccess["status"],
): AdminAccess {
  return {
    userId: "user_1",
    role,
    status,
    updatedAt: "2026-11-13T12:00:00.000Z",
  };
}

const EDITOR_ACTIONS: readonly AdminAction[] = [
  "private:read",
  "shop:edit",
  "photo:upload",
  "shop:publish",
];

describe("admin permissions", () => {
  it("lets approved owners perform every action", () => {
    for (const action of ADMIN_ACTIONS) {
      expect(can(access("owner", "approved"), action)).toBe(true);
    }
  });

  it("lets approved editors do everything except manage access", () => {
    for (const action of EDITOR_ACTIONS) {
      expect(can(access("editor", "approved"), action)).toBe(true);
    }
    expect(can(access("editor", "approved"), "access:manage")).toBe(false);
  });

  it("denies every action without an approved record", () => {
    for (const action of ADMIN_ACTIONS) {
      expect(can(null, action)).toBe(false);
      expect(can(access("owner", "revoked"), action)).toBe(false);
      expect(can(access("owner", "blocked"), action)).toBe(false);
      expect(can(access("editor", "revoked"), action)).toBe(false);
      expect(can(access("editor", "blocked"), action)).toBe(false);
    }
  });

  it("denies unknown actions", () => {
    expect(can(access("owner", "approved"), "shop:delete" as AdminAction)).toBe(
      false,
    );
  });
});
