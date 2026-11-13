import { PersistenceError } from "./errors";

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

// Error messages never include the URI because it contains credentials.
export function readMongoConfig(
  env: Readonly<Record<string, string | undefined>>,
): MongoConfig {
  const uri = requireSetting(env, "MONGODB_URI");
  const databaseName = requireSetting(env, "MONGODB_DB_NAME");
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new PersistenceError(
      "configuration",
      "MONGODB_URI must be a mongodb:// or mongodb+srv:// URI.",
    );
  }
  return { uri, databaseName };
}
