import "@tanstack/react-start/server-only";
import { MongoClient } from "mongodb";
import {
  createPublicMongoReader,
  type PublicMongoDatabase,
  PublicReadError,
  type PublicShopReader,
} from "./public-reader";

interface PublicMongoConfig {
  readonly uri: string;
  readonly databaseName: string;
}

function readConfig(
  env: Readonly<Record<string, string | undefined>>,
): PublicMongoConfig {
  const uri = env.MONGODB_URI?.trim() ?? "";
  const databaseName = env.MONGODB_DB_NAME?.trim() ?? "";
  if (uri === "" || databaseName === "") {
    throw new PublicReadError();
  }
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new PublicReadError();
  }
  return { uri, databaseName };
}

let database: Promise<PublicMongoDatabase> | null = null;

async function getDatabase(): Promise<PublicMongoDatabase> {
  if (database === null) {
    const config = readConfig(process.env);
    const client = new MongoClient(config.uri);
    database = client.connect().then(
      () => client.db(config.databaseName) as unknown as PublicMongoDatabase,
      async () => {
        database = null;
        await client.close().catch(() => undefined);
        throw new PublicReadError();
      },
    );
  }
  return database;
}

export const serverPublicShopReader: PublicShopReader = {
  async get(shopId) {
    try {
      return await createPublicMongoReader(await getDatabase()).get(shopId);
    } catch (error) {
      if (error instanceof PublicReadError) {
        throw error;
      }
      throw new PublicReadError();
    }
  },
  async list() {
    try {
      return await createPublicMongoReader(await getDatabase()).list();
    } catch (error) {
      if (error instanceof PublicReadError) {
        throw error;
      }
      throw new PublicReadError();
    }
  },
};
