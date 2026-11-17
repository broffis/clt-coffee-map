import type { AccessAuditRecord } from "../domain/access";

export interface AccessAuditRepository {
  append(record: AccessAuditRecord): Promise<void>;
  list(): Promise<readonly AccessAuditRecord[]>;
}
