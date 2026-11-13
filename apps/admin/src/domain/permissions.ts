import type { AdminAccess } from "./access";

export const ADMIN_ACTIONS = [
  "private:read",
  "shop:edit",
  "photo:upload",
  "shop:publish",
  "access:manage",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

// Deny by default: only an approved record, and only owners manage access.
export function can(access: AdminAccess | null, action: AdminAction): boolean {
  if (access?.status !== "approved") {
    return false;
  }
  if (action === "access:manage") {
    return access.role === "owner";
  }
  return (ADMIN_ACTIONS as readonly string[]).includes(action);
}
