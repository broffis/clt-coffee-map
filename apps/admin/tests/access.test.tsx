import { describe, expect, it } from "vitest";
import {
  type AdminAccess,
  approveAccess,
  blockAccess,
  createOwnerAccess,
  hasActiveAccess,
  restoreAccess,
  revokeAccess,
} from "../src/domain/access";

const T1 = new Date("2026-11-13T12:00:00.000Z");
const T2 = new Date("2026-11-14T12:00:00.000Z");

function editor(status: AdminAccess["status"]): AdminAccess {
  return {
    userId: "user_1",
    role: "editor",
    status,
    updatedAt: T1.toISOString(),
  };
}

describe("admin access records", () => {
  it("denies by default when there is no record", () => {
    expect(hasActiveAccess(null)).toBe(false);
  });

  it("grants access only to approved records", () => {
    expect(hasActiveAccess(editor("approved"))).toBe(true);
    expect(hasActiveAccess(editor("revoked"))).toBe(false);
    expect(hasActiveAccess(editor("blocked"))).toBe(false);
  });

  it("approves a new user as an editor", () => {
    expect(approveAccess(null, "user_1", T1)).toEqual(editor("approved"));
  });

  it("keeps an already approved user unchanged", () => {
    const current = editor("approved");

    expect(approveAccess(current, "user_1", T2)).toBe(current);
  });

  it("requires an explicit restore for revoked and blocked users", () => {
    expect(() => approveAccess(editor("revoked"), "user_1", T2)).toThrow(
      /restore/i,
    );
    expect(() => approveAccess(editor("blocked"), "user_1", T2)).toThrow(
      /restore/i,
    );
  });

  it("revokes an approved user and keeps the record", () => {
    expect(revokeAccess(editor("approved"), T2)).toEqual({
      ...editor("revoked"),
      updatedAt: T2.toISOString(),
    });
  });

  it("rejects revoking users who are not approved", () => {
    expect(() => revokeAccess(null, T2)).toThrow(/approved/);
    expect(() => revokeAccess(editor("revoked"), T2)).toThrow(/approved/);
    expect(() => revokeAccess(editor("blocked"), T2)).toThrow(/approved/);
  });

  it("blocks any user, including one with no record", () => {
    expect(blockAccess(null, "user_1", T1)).toEqual(editor("blocked"));
    expect(blockAccess(editor("approved"), "user_1", T2).status).toBe(
      "blocked",
    );
    expect(blockAccess(editor("revoked"), "user_1", T2).status).toBe("blocked");
  });

  it("keeps a blocked user unchanged when blocked again", () => {
    const current = editor("blocked");

    expect(blockAccess(current, "user_1", T2)).toBe(current);
  });

  it("restores revoked and blocked users to approved", () => {
    expect(restoreAccess(editor("revoked"), T2)).toEqual({
      ...editor("approved"),
      updatedAt: T2.toISOString(),
    });
    expect(restoreAccess(editor("blocked"), T2).status).toBe("approved");
  });

  it("rejects restoring users who are not revoked or blocked", () => {
    expect(() => restoreAccess(null, T2)).toThrow(/revoked or blocked/);
    expect(() => restoreAccess(editor("approved"), T2)).toThrow(
      /revoked or blocked/,
    );
  });

  it("creates an approved owner record", () => {
    expect(createOwnerAccess("user_owner", T1)).toEqual({
      userId: "user_owner",
      role: "owner",
      status: "approved",
      updatedAt: T1.toISOString(),
    });
  });

  it("never lets an approval or block change a user's role", () => {
    const owner = createOwnerAccess("user_1", T1);

    expect(blockAccess(owner, "user_1", T2).role).toBe("owner");
    expect(restoreAccess(blockAccess(owner, "user_1", T2), T2).role).toBe(
      "owner",
    );
  });

  it("rejects blank user IDs and mismatched records", () => {
    expect(() => approveAccess(null, " ", T1)).toThrow(RangeError);
    expect(() => blockAccess(null, "", T1)).toThrow(RangeError);
    expect(() => createOwnerAccess(" ", T1)).toThrow(RangeError);
    expect(() => approveAccess(editor("approved"), "user_2", T1)).toThrow(
      /different user/,
    );
    expect(() => blockAccess(editor("approved"), "user_2", T1)).toThrow(
      /different user/,
    );
  });
});
