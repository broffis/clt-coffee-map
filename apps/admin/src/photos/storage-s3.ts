import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PersistenceError } from "../persistence/errors.ts";
import type { PhotoStorage } from "./storage.ts";

export interface PhotoStorageConfig {
  readonly endpoint: string;
  readonly bucket: string;
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

type Env = Readonly<Record<string, string | undefined>>;

function requireSetting(env: Env, name: string): string {
  const value = env[name]?.trim() ?? "";
  if (value.length === 0) {
    throw new PersistenceError("configuration", `${name} must be set.`);
  }
  return value;
}

// Provider-neutral names keep any S3-compatible store a configuration change.
// Error messages never include credential values.
export function readPhotoStorageConfig(env: Env): PhotoStorageConfig {
  const endpoint = requireSetting(env, "PHOTO_STORAGE_ENDPOINT");
  const bucket = requireSetting(env, "PHOTO_STORAGE_BUCKET");
  const accessKeyId = requireSetting(env, "PHOTO_STORAGE_ACCESS_KEY_ID");
  const secretAccessKey = requireSetting(
    env,
    "PHOTO_STORAGE_SECRET_ACCESS_KEY",
  );
  if (!URL.canParse(endpoint) || new URL(endpoint).protocol !== "https:") {
    throw new PersistenceError(
      "configuration",
      "PHOTO_STORAGE_ENDPOINT must be an HTTPS URL.",
    );
  }
  const region = env.PHOTO_STORAGE_REGION?.trim() || "auto";
  return { endpoint, bucket, region, accessKeyId, secretAccessKey };
}

interface S3Sender {
  send(command: PutObjectCommand | DeleteObjectCommand): Promise<unknown>;
}

// Provider errors can echo endpoints or request details, so only a generic
// unavailable error leaves this module.
export class S3PhotoStorage implements PhotoStorage {
  readonly #client: S3Sender;
  readonly #bucket: string;

  constructor(client: S3Sender, bucket: string) {
    this.#client = client;
    this.#bucket = bucket;
  }

  async put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    await this.#send(
      new PutObjectCommand({
        Bucket: this.#bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.#send(
      new DeleteObjectCommand({ Bucket: this.#bucket, Key: key }),
    );
  }

  async #send(command: PutObjectCommand | DeleteObjectCommand): Promise<void> {
    try {
      await this.#client.send(command);
    } catch {
      throw new PersistenceError(
        "unavailable",
        "Photo storage is unavailable.",
      );
    }
  }
}

export function createS3PhotoStorage(config: PhotoStorageConfig): PhotoStorage {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return new S3PhotoStorage(client, config.bucket);
}
