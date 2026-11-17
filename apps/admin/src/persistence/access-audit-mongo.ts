import { randomUUID } from "node:crypto";
import type { AccessAuditRecord } from "../domain/access";
import type { AccessAuditRepository } from "./access-audit-repository";
import {
  type DocumentCollection,
  type MongoDatabase,
  run as runDatabaseOperation,
} from "./mongo-repositories";

type AccessAuditDocument = AccessAuditRecord & { _id: string };

export function createMongoAccessAuditRepository(
  database: MongoDatabase,
): AccessAuditRepository {
  const collection = database.collection<AccessAuditDocument>(
    "adminAccessAudit",
  ) as DocumentCollection<AccessAuditDocument> & {
    insertOne(document: AccessAuditDocument): Promise<unknown>;
  };

  return {
    append: (record) =>
      runDatabaseOperation(() =>
        collection.insertOne({ ...record, _id: randomUUID() }),
      ).then(() => undefined),
    list: () =>
      runDatabaseOperation(async () => {
        const records = await collection.find({}).toArray();
        return records.map(({ _id, ...record }) => record);
      }),
  };
}
