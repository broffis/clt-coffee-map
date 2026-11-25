import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import {
  readPhotoDeliveryConfig,
  S3PhotoDelivery,
} from "../src/photos/delivery-s3";

const env = {
  PHOTO_STORAGE_ENDPOINT: "https://t3.storage.dev",
  PHOTO_STORAGE_BUCKET: "private-bucket",
  PHOTO_STORAGE_ACCESS_KEY_ID: "id",
  PHOTO_STORAGE_SECRET_ACCESS_KEY: "secret",
  PHOTO_DELIVERY_BUCKET: "public-bucket",
};

describe("photo delivery configuration", () => {
  it("requires a different delivery bucket", () => {
    expect(readPhotoDeliveryConfig(env).deliveryBucket).toBe("public-bucket");
    expect(() =>
      readPhotoDeliveryConfig({ ...env, PHOTO_DELIVERY_BUCKET: "" }),
    ).toThrow("PHOTO_DELIVERY_BUCKET must be set.");
    expect(() =>
      readPhotoDeliveryConfig({
        ...env,
        PHOTO_DELIVERY_BUCKET: "private-bucket",
      }),
    ).toThrow("Photo delivery and upload buckets must be different.");
  });
});

describe("S3 photo delivery", () => {
  it("copies a published variant with WebP and one-hour public caching", async () => {
    const send = vi.fn().mockResolvedValue({});
    const delivery = new S3PhotoDelivery(
      { send },
      "private-bucket",
      "public-bucket",
    );

    await delivery.copy("photos/photo-1/480.webp");

    const command = send.mock.calls[0]?.[0] as CopyObjectCommand;
    expect(command).toBeInstanceOf(CopyObjectCommand);
    expect(command.input).toEqual({
      Bucket: "public-bucket",
      CopySource: "private-bucket/photos/photo-1/480.webp",
      Key: "photos/photo-1/480.webp",
      MetadataDirective: "REPLACE",
      ContentType: "image/webp",
      CacheControl: "public, max-age=3600",
    });
  });

  it("hides provider errors", async () => {
    const send = vi.fn().mockRejectedValue(new Error("secret details"));
    const delivery = new S3PhotoDelivery({ send }, "private", "public");

    await expect(delivery.copy("photos/p1/480.webp")).rejects.toThrow(
      "Photo storage is unavailable.",
    );
  });
});
