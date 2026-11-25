import { CopyObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PersistenceError } from "../persistence/errors";
import type { PhotoDelivery } from "./delivery";
import { type PhotoStorageConfig, readPhotoStorageConfig } from "./storage-s3";

interface PhotoDeliveryConfig extends PhotoStorageConfig {
  readonly deliveryBucket: string;
}

export function readPhotoDeliveryConfig(
  env: Readonly<Record<string, string | undefined>>,
): PhotoDeliveryConfig {
  const storage = readPhotoStorageConfig(env);
  const deliveryBucket = env.PHOTO_DELIVERY_BUCKET?.trim() ?? "";
  if (deliveryBucket === "") {
    throw new PersistenceError(
      "configuration",
      "PHOTO_DELIVERY_BUCKET must be set.",
    );
  }
  if (deliveryBucket === storage.bucket) {
    throw new PersistenceError(
      "configuration",
      "Photo delivery and upload buckets must be different.",
    );
  }
  return { ...storage, deliveryBucket };
}

interface CopySender {
  send(command: CopyObjectCommand): Promise<unknown>;
}

export class S3PhotoDelivery implements PhotoDelivery {
  constructor(
    private readonly client: CopySender,
    private readonly sourceBucket: string,
    private readonly deliveryBucket: string,
  ) {}

  async copy(key: string): Promise<void> {
    const source = [this.sourceBucket, ...key.split("/")]
      .map(encodeURIComponent)
      .join("/");
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.deliveryBucket,
          CopySource: source,
          Key: key,
          ContentType: "image/webp",
          CacheControl: "public, max-age=3600",
          MetadataDirective: "REPLACE",
        }),
      );
    } catch {
      throw new PersistenceError(
        "unavailable",
        "Photo storage is unavailable.",
      );
    }
  }
}

export function createS3PhotoDelivery(
  config: PhotoDeliveryConfig,
): PhotoDelivery {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return new S3PhotoDelivery(client, config.bucket, config.deliveryBucket);
}
