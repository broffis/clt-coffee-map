import type { AdminAccess } from "../domain/access";
import type { AccessRepository } from "./access-repository";
import { checkIdentifier } from "./checks";
import { PersistenceError } from "./errors";
import {
  type MongoDatabase,
  run as runDatabaseOperation,
} from "./mongo-repositories";

type AccessDocument = {
  _id: string;
  role: AdminAccess["role"];
  status: AdminAccess["status"];
  updatedAt: string;
};

const ROLES: readonly string[] = ["owner", "editor"];
const STATUSES: readonly string[] = ["approved", "revoked", "blocked"];

// An unrecognized stored value must never be read as access.
function toAccess(document: AccessDocument): AdminAccess {
  if (!ROLES.includes(document.role) || !STATUSES.includes(document.status)) {
    throw new PersistenceError(
      "validation",
      "Stored access record is invalid.",
    );
  }
  return {
    userId: document._id,
    role: document.role,
    status: document.status,
    updatedAt: document.updatedAt,
  };
}

export function createMongoAccessRepository(
  database: MongoDatabase,
): AccessRepository {
  const collection = database.collection<AccessDocument>("adminAccess");

  return {
    get: (userId) =>
      runDatabaseOperation(async () => {
        checkIdentifier(userId, "User ID");
        const document = await collection.findOne({ _id: userId });
        return document === null ? null : toAccess(document);
      }),
    list: () =>
      runDatabaseOperation(async () =>
        (await collection.find({}).toArray()).map(toAccess),
      ),
    save: (access) =>
      runDatabaseOperation(async () => {
        checkIdentifier(access.userId, "User ID");
        await collection.replaceOne(
          { _id: access.userId },
          {
            role: access.role,
            status: access.status,
            updatedAt: access.updatedAt,
          },
          { upsert: true },
        );
      }),
  };
}
