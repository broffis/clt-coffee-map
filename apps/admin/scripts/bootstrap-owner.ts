import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { MongoClient } from "mongodb";
import {
  bootstrapInitialOwner,
  OwnerBootstrapError,
  readOwnerBootstrapConfig,
} from "../src/authorization/owner-bootstrap.ts";

export async function runOwnerBootstrapCommand(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): Promise<void> {
  if (args.length > 1 || (args.length === 1 && args[0] !== "--apply")) {
    throw new OwnerBootstrapError(
      "Usage: pnpm admin:bootstrap-owner [--apply]",
    );
  }
  const config = readOwnerBootstrapConfig(env);
  const apply = args[0] === "--apply";
  if (apply) {
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new OwnerBootstrapError(
        "Applying bootstrap requires an interactive terminal.",
      );
    }
    const prompt = createInterface({ input: stdin, output: stdout });
    let confirmation: string;
    try {
      confirmation = await prompt.question(
        `Database: ${config.databaseName}\nVerify the target in your Clerk development dashboard.\nType ${config.userId} to grant initial owner access: `,
      );
    } finally {
      prompt.close();
    }
    if (confirmation !== config.userId) {
      throw new OwnerBootstrapError(
        "Confirmation did not match. Nothing was written.",
      );
    }
  }

  const client = new MongoClient(config.uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 8000,
    maxPoolSize: 1,
  });
  try {
    await client.connect();
    await bootstrapInitialOwner(client, config, { apply });
  } finally {
    await client.close();
  }
  console.log(
    apply
      ? "Initial owner and audit entry committed. Remove the temporary database user and bootstrap file."
      : "Preflight passed. No records written or permissions granted.",
  );
}

if (import.meta.main) {
  try {
    await runOwnerBootstrapCommand(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(
      error instanceof OwnerBootstrapError
        ? error.message
        : "Bootstrap could not be confirmed. Inspect access and audit records before retrying.",
    );
    process.exitCode = 1;
  }
}
