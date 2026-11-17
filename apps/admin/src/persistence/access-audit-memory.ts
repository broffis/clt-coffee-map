import type { AccessAuditRecord } from "../domain/access";
import type { AccessAuditRepository } from "./access-audit-repository";

export function createInMemoryAccessAuditRepository(): AccessAuditRepository {
  const records: AccessAuditRecord[] = [];

  return {
    async append(record) {
      records.push(structuredClone(record));
    },
    async list() {
      return records.map((record) => structuredClone(record));
    },
  };
}
