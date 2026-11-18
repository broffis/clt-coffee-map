import { PersistenceError } from "./errors.ts";

export interface MongoConfig {
  readonly uri: string;
  readonly databaseName: string;
}

function requireSetting(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string {
  const value = env[name]?.trim() ?? "";
  if (value.length === 0) {
    throw new PersistenceError("configuration", `${name} must be set.`);
  }
  return value;
}

type Env = Readonly<Record<string, string | undefined>>;

// Error messages never include the URI because it contains credentials.
function readConfig(env: Env, uriName: string, dbName: string): MongoConfig {
  const uri = requireSetting(env, uriName);
  const databaseName = requireSetting(env, dbName);
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new PersistenceError(
      "configuration",
      `${uriName} must be a mongodb:// or mongodb+srv:// URI.`,
    );
  }
  return { uri, databaseName };
}

export function readMongoConfig(env: Env): MongoConfig {
  return readConfig(env, "MONGODB_URI", "MONGODB_DB_NAME");
}

// Editor writes use dedicated least-privilege credentials, never the
// read-only application user.
export function readMongoWriteConfig(env: Env): MongoConfig {
  return readConfig(env, "MONGODB_WRITE_URI", "MONGODB_WRITE_DB_NAME");
}
