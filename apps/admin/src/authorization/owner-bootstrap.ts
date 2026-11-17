import type { MongoClient } from "mongodb";
import {
  type AccessAuditRecord,
  type AdminAccess,
  createOwnerAccess,
} from "../domain/access.ts";
import { readMongoConfig } from "../persistence/mongo-config.ts";

export interface OwnerBootstrapConfig {
  readonly uri: string;
  readonly databaseName: string;
  readonly userId: string;
}

export class OwnerBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnerBootstrapError";
  }
}

export function readOwnerBootstrapConfig(
  env: Readonly<Record<string, string | undefined>>,
): OwnerBootstrapConfig {
  try {
    const config = readMongoConfig({
      MONGODB_URI: env.BOOTSTRAP_MONGODB_URI,
      MONGODB_DB_NAME: env.BOOTSTRAP_MONGODB_DB_NAME,
    });
    const userId = env.BOOTSTRAP_CLERK_USER_ID?.trim() ?? "";
    if (!/^user_[A-Za-z0-9]+$/.test(userId)) {
      throw new OwnerBootstrapError("Invalid Clerk user ID.");
    }
    return { ...config, userId };
  } catch {
    throw new OwnerBootstrapError(
      "Set valid BOOTSTRAP_MONGODB_URI, BOOTSTRAP_MONGODB_DB_NAME, and BOOTSTRAP_CLERK_USER_ID.",
    );
  }
}

type OwnerDocument = Omit<AdminAccess, "userId"> & { _id: string };
type AuditDocument = AccessAuditRecord & { _id: string };

export async function bootstrapInitialOwner(
  client: Pick<MongoClient, "db" | "withSession">,
  config: OwnerBootstrapConfig,
  { apply = false, now = new Date() } = {},
): Promise<void> {
  const owner = createOwnerAccess(config.userId, now);
  const database = client.db(config.databaseName);
  const access = database.collection<OwnerDocument>("adminAccess");
  const audit = database.collection<AuditDocument>("adminAccessAudit");
  try {
    await client.withSession((session) =>
      session.withTransaction(
        async () => {
          if (await access.findOne({ role: "owner" }, { session })) {
            throw new OwnerBootstrapError("An owner record already exists.");
          }
          if (await access.findOne({ _id: owner.userId }, { session })) {
            throw new OwnerBootstrapError(
              "The target already has an access record.",
            );
          }
          const auditId = "initial-owner-bootstrap";
          if (await audit.findOne({ _id: auditId }, { session })) {
            throw new OwnerBootstrapError(
              "Initial owner bootstrap was already used.",
            );
          }
          if (!apply) {
            return;
          }
          // A shared unique key prevents concurrent bootstraps for different IDs.
          await audit.insertOne(
            {
              _id: auditId,
              actorUserId: owner.userId,
              targetUserId: owner.userId,
              action: "bootstrap-owner",
              occurredAt: owner.updatedAt,
            },
            { session },
          );
          await access.insertOne(
            {
              _id: owner.userId,
              role: owner.role,
              status: owner.status,
              updatedAt: owner.updatedAt,
            },
            { session },
          );
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          maxCommitTimeMS: 5000,
        },
      ),
    );
  } catch (error) {
    if (error instanceof OwnerBootstrapError) {
      throw error;
    }
    throw new OwnerBootstrapError(
      "Bootstrap could not be confirmed. Inspect access and audit records before retrying.",
    );
  }
}
