import { checkIdentifier } from "./checks";
import type { AccessRepository } from "./access-repository";
import type { AdminAccess } from "../domain/access";

export function createInMemoryAccessRepository(): AccessRepository {
  const records = new Map<string, AdminAccess>();

  return {
    async get(userId) {
      checkIdentifier(userId, "User ID");
      const record = records.get(userId);
      return record === undefined ? null : structuredClone(record);
    },
    async list() {
      return [...records.values()]
        .sort((a, b) => a.userId.localeCompare(b.userId))
        .map((record) => structuredClone(record));
    },
    async save(access) {
      checkIdentifier(access.userId, "User ID");
      records.set(access.userId, structuredClone(access));
    },
  };
}
